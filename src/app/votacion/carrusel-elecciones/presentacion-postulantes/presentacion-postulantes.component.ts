import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import confetti from 'canvas-confetti';
import { EleccionService } from '../../../core/services/eleccion.service';
import { Candidato, Eleccion, Voto } from '../../../core/interfaces/eleccion.model';
import { AuthService } from '../../../core/services/auth.service';
interface VotoTemporal {
  candidatoId: string;
  usuarioId: string;
  belleza: number;      // 1-5
  carisma: number;      // 1-5
  elegancia: number;    // 1-5
  total: number;        // 3-15
  promedio: number;     // 1-5
  fecha: Date;
}

interface CriterioEvaluacion {
  id: "belleza" | "carisma" | "elegancia";
  nombre: string;
}

@Component({
  selector: 'app-presentacion-postulantes',
  imports: [CommonModule, RouterModule],
  templateUrl: './presentacion-postulantes.component.html',
  styleUrl: './presentacion-postulantes.component.css'
})
export class PresentacionPostulantesComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eleccionService = inject(EleccionService);
  private authService = inject(AuthService);
  showFinalizarPanel = signal<boolean>(false);

  eleccion = signal<Eleccion | null>(null);
  loading = signal<boolean>(true);
  error = signal<string>('');

  // Countdown
  endDate = signal<Date>(new Date())
  countdown = signal<string>("00:00:00")
  private countdownInterval: any

  criterios = signal<CriterioEvaluacion[]>([
    { id: "belleza", nombre: "Belleza" },
    { id: "carisma", nombre: "Carisma" },
    { id: "elegancia", nombre: "Elegancia" },
  ])

  // Votos temporales
  votosTemporales = signal<Map<string, VotoTemporal>>(new Map());
  votacionFinalizada = signal<boolean>(false);
  showVoteMessage = signal<boolean>(false);

  // Gestión de imágenes
  imageIndices = signal<Map<string, number>>(new Map());


  hasVotedAllCandidates = computed(() => {
    const eleccionActual = this.eleccion();
    const votos = this.votosTemporales();

    if (!eleccionActual?.candidatos) return false;

    //  retorna true si al menos UN candidato tiene voto válido
    return eleccionActual.candidatos.some(candidato =>
      candidato.id && this.tieneVotoCompleto(candidato.id)
    );
  });

  toggleFinalizarPanel(): void {
    this.showFinalizarPanel.update(show => !show);
  }
  totalVotosRealizados = computed(() => {
    return Array.from(this.votosTemporales().values()).filter(voto =>
      this.tieneVotoCompleto(voto.candidatoId)
    ).length;
  });
  usuarioActual = computed(() => {
    return this.authService.currentUser();
  });

  ngOnInit(): void {
    this.cargarEleccion();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  cargarEleccion(): void {
    const eleccionId = this.route.snapshot.paramMap.get('id');

    if (!eleccionId) {
      this.error.set('ID de elección no válido');
      this.loading.set(false);
      return;
    }

    this.loading.set(true);

    this.eleccionService.getEleccionById(eleccionId).subscribe({
      next: (eleccion) => {
        this.eleccion.set(eleccion);
        this.loading.set(false);

        this.configurarCountdown(eleccion);
        this.inicializarIndicesImagenes(eleccion.candidatos);
        this.cargarVotosExistentes();
      },
      error: (error) => {
        console.error('Error al cargar la elección:', error);
        this.error.set('Error al cargar la elección');
        this.loading.set(false);
      }
    });
  }

  cargarVotosExistentes(): void {
    const usuario = this.usuarioActual();
    const eleccion = this.eleccion();

    if (!usuario || !eleccion?.candidatos) return;

    const nuevosVotos = new Map<string, VotoTemporal>();

    eleccion.candidatos.forEach(candidato => {
      if (candidato.id && candidato.votos) {
        const votoExistente = candidato.votos.find(v => v.usuarioId === usuario.uid);
        if (votoExistente) {
          // Convertir de escala 2-10 a 1-5 para mas precicion a la hora de hacer calculos
          nuevosVotos.set(candidato.id, {
            candidatoId: candidato.id,
            usuarioId: usuario.uid,
            belleza: votoExistente.belleza / 2,
            carisma: votoExistente.carisma / 2,
            elegancia: votoExistente.elegancia / 2,
            total: votoExistente.total / 2,
            promedio: votoExistente.promedio / 2,
            fecha: votoExistente.fecha
          });
        }
      }
    });

    this.votosTemporales.set(nuevosVotos);
  }

  // MÉTODOS DE VOTACIÓN
  votarCriterio(candidatoId: string, criterioId: "belleza" | "carisma" | "elegancia", valor: number): void {
    const usuario = this.usuarioActual();

    if (this.votacionFinalizada() || !usuario) {
      alert('Debes iniciar sesión para votar');
      return;
    }

    this.votosTemporales.update(votos => {
      const nuevoMap = new Map(votos);
      const votoExistente = nuevoMap.get(candidatoId);

      if (votoExistente) {
        // Actualizar voto existente
        const votoActualizado = {
          ...votoExistente,
          [criterioId]: valor,
          fecha: new Date()
        };

        // Recalcular total y promedio
        votoActualizado.total = votoActualizado.belleza + votoActualizado.carisma + votoActualizado.elegancia;
        votoActualizado.promedio = Number((votoActualizado.total / 3).toFixed(2));

        nuevoMap.set(candidatoId, votoActualizado);
      } else {
        // Crear nuevo voto
        const nuevoVoto: VotoTemporal = {
          candidatoId,
          usuarioId: usuario.uid,
          belleza: criterioId === 'belleza' ? valor : 0,
          carisma: criterioId === 'carisma' ? valor : 0,
          elegancia: criterioId === 'elegancia' ? valor : 0,
          total: valor, // Solo un criterio por ahora
          promedio: valor,
          fecha: new Date()
        };
        nuevoMap.set(candidatoId, nuevoVoto);
      }

      return nuevoMap;
    });
  }

  getVotoCriterio(candidatoId: string, criterioId: "belleza" | "carisma" | "elegancia"): number {
    const voto = this.votosTemporales().get(candidatoId);
    return voto ? voto[criterioId] : 0;
  }

  tieneVotoCompleto(candidatoId: string): boolean {
    const voto = this.votosTemporales().get(candidatoId);
    if (!voto) return false;
    return voto.belleza > 0 || voto.carisma > 0 || voto.elegancia > 0;
  }

  async finalizarVotacion(): Promise<void> {
    const usuario = this.usuarioActual();

    if (!usuario) {
      this.router.navigate(['/login']);
      return;
    }

    // Cambiar esta validación
    if (!this.hasVotedAllCandidates()) {
      alert('Debes votar por al menos una candidata antes de finalizar');
      return;
    }

    this.votacionFinalizada.set(true);
    this.showFinalizarPanel.set(false);

    try {
      await this.guardarVotosEnFirebase();
      this.showVoteMessage.set(true);
      this.launchConfetti();
    } catch (error) {
      console.error('Error al finalizar votación:', error);
      this.votacionFinalizada.set(false);
    }
  }

  private async guardarVotosEnFirebase(): Promise<void> {
    const eleccion = this.eleccion();
    const votosTemporalesMap = this.votosTemporales();

    if (!eleccion?.id) return;

    try {
      // Filtrar solo los votos que tienen al menos un criterio > 0
      const votosValidos = Array.from(votosTemporalesMap.entries())
        .filter(([candidatoId, votoTemp]) => this.tieneVotoCompleto(candidatoId));

      // Guardar cada voto válido individualmente
      // VotoTemp object complete
      const promesas = votosValidos.map(([candidatoId, votoTemp]) => {
        // Convertir a la interfaz Voto (escala 2-10) y crear el voto
        const voto: Voto = {
          usuarioId: votoTemp.usuarioId,
          belleza: votoTemp.belleza * 2,
          carisma: votoTemp.carisma * 2,
          elegancia: votoTemp.elegancia * 2,
          total: votoTemp.total * 2,
          promedio: Number((votoTemp.promedio * 2).toFixed(2)),
          fecha: new Date()
        };

        return this.eleccionService.agregarVotoACandidato(eleccion.id!, candidatoId, voto);
      });

      // Paralelo
      await Promise.all(promesas);

    } catch (error) {
      alert('Error al guardar los votos. Intenta nuevamente.');
      this.votacionFinalizada.set(false);
      throw error;
    }
  }

  // MÉTODOS EXISTENTES PARA IMÁGENES
  inicializarIndicesImagenes(candidatos: Candidato[]): void {
    const nuevosIndices = new Map<string, number>();
    candidatos.forEach(candidato => {
      if (candidato.id) {
        nuevosIndices.set(candidato.id, 0);
      }
    });
    this.imageIndices.set(nuevosIndices);
  }

  getCurrentImageIndex(candidatoId: string): number {
    return this.imageIndices().get(candidatoId) || 0;
  }

  nextImage(candidatoId: string, totalImages: number): void {
    const currentIndex = this.getCurrentImageIndex(candidatoId);
    const newIndex = (currentIndex + 1) % totalImages;
    this.imageIndices.update((map) => {
      const newMap = new Map(map);
      newMap.set(candidatoId, newIndex);
      return newMap;
    });
  }

  prevImage(candidatoId: string, totalImages: number): void {
    const currentIndex = this.getCurrentImageIndex(candidatoId);
    const newIndex = (currentIndex - 1 + totalImages) % totalImages;
    this.imageIndices.update((map) => {
      const newMap = new Map(map);
      newMap.set(candidatoId, newIndex);
      return newMap;
    });
  }

  goToImage(candidatoId: string, index: number): void {
    this.imageIndices.update((map) => {
      const newMap = new Map(map);
      newMap.set(candidatoId, index);
      return newMap;
    });
  }

  getImageAtOffset(candidatoId: string, imagenes: any[], offset: number): string {
    const currentIndex = this.getCurrentImageIndex(candidatoId);
    const index = (currentIndex + offset + imagenes.length) % imagenes.length;
    return imagenes[index]?.secure_url || '';
  }

  getImageRange(totalImages: number): number[] {
    return Array.from({ length: totalImages }, (_, i) => i);
  }

  getHeartArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  formatearFecha(fechaString: string): string {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  configurarCountdown(eleccion: Eleccion): void {
    const fechaFin = new Date(eleccion.fechaFin);
    this.endDate.set(fechaFin);

    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown(): void {
    const now = new Date().getTime();
    const end = this.endDate().getTime();
    const distance = end - now;

    if (distance < 0) {
      this.countdown.set("00:00:00");
      if (this.countdownInterval) {
        clearInterval(this.countdownInterval);
      }
      return;
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const formattedHours = hours.toString().padStart(2, "0");
    const formattedMinutes = minutes.toString().padStart(2, "0");
    const formattedSeconds = seconds.toString().padStart(2, "0");

    this.countdown.set(`${formattedHours}:${formattedMinutes}:${formattedSeconds}`);
  }

  private launchConfetti(): void {
    // Primer disparo
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });


  }
}
