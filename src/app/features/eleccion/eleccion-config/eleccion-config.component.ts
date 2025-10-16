import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Candidato, Eleccion, ImagenCandidato } from '../../../core/interfaces/eleccion.model';
import { ActivatedRoute } from '@angular/router';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-eleccion-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './eleccion-config.component.html',
  styleUrls: ['./eleccion-config.component.css']
})
export class EleccionConfigComponent implements OnInit {
  private fb:FormBuilder = inject(FormBuilder);
  private route:ActivatedRoute = inject(ActivatedRoute);
  private eleccionService: EleccionService = inject(EleccionService);
  private cloudinaryService: CloudinaryService = inject(CloudinaryService);

  isModalVisible = false;
  candidatoForm: FormGroup;
  eleccion: WritableSignal<Eleccion | null> = signal(null);

  private archivosParaSubir: (File | null)[] = [null, null, null];
  vistasPrevias: (string | null)[] = [null, null, null];

  isSubmitting = false;
  currentImageIndexes: number[] = [];
  isImageLoading: boolean[] = [];
  isEditMode = false;
  candidatoId: string | null = null;

  constructor() {
    this.candidatoForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(18)]],
      hobies: [''],
      propuesta: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.eleccionService.getEleccionById(id).subscribe(eleccion => {
        this.eleccion.set(eleccion);
        if (eleccion && eleccion.candidatos) {
          this.currentImageIndexes = eleccion.candidatos.map(() => 0);
          this.isImageLoading = eleccion.candidatos.map(() => false);
        }
      });
    }
  }

  nextImage(candidatoIndex: number): void {
    const candidato = this.eleccion()?.candidatos[candidatoIndex];
    if (candidato && candidato.imagenes.length > 1) {
      this.isImageLoading[candidatoIndex] = true;
      setTimeout(() => {
        this.currentImageIndexes[candidatoIndex] = (this.currentImageIndexes[candidatoIndex] + 1) % candidato.imagenes.length;
        this.isImageLoading[candidatoIndex] = false;
      }, 500);
    }
  }

  prevImage(candidatoIndex: number): void {
    const candidato = this.eleccion()?.candidatos[candidatoIndex];
    if (candidato && candidato.imagenes.length > 1) {
      this.isImageLoading[candidatoIndex] = true;
      setTimeout(() => {
        this.currentImageIndexes[candidatoIndex] = (this.currentImageIndexes[candidatoIndex] - 1 + candidato.imagenes.length) % candidato.imagenes.length;
        this.isImageLoading[candidatoIndex] = false;
      }, 500);
    }
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files?.[0];
    if (!file) return;

    this.archivosParaSubir[index] = file;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      this.vistasPrevias[index] = reader.result as string;
    };
  }

  openModal(candidato?: Candidato) {
    this.candidatoForm.reset();
    if (candidato) {
      this.isEditMode = true;
      this.candidatoId = candidato.id!;
      this.candidatoForm.patchValue(candidato);
      this.vistasPrevias = candidato.imagenes.map(img => img.secure_url);
    } else {
      this.isEditMode = false;
      this.candidatoId = null;
      this.vistasPrevias = [null, null, null];
    }
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
  }

  async onSubmit() {
    if (this.candidatoForm.invalid) {
      this.candidatoForm.markAllAsTouched();
      return;
    }
    this.isSubmitting = true;

    const imagenesSubidas: (ImagenCandidato | null)[] = [null, null, null];
    for (let i = 0; i < this.archivosParaSubir.length; i++) {
      const archivo = this.archivosParaSubir[i];
      if (archivo) {
        const resultado = await this.cloudinaryService.uploadImage(archivo);
        imagenesSubidas[i] = resultado;
      }
    }

    const imagenesFinales: ImagenCandidato[] = [];
    for (let i = 0; i < 3; i++) {
      if (imagenesSubidas[i]) {
        imagenesFinales.push(imagenesSubidas[i]!);
      } else if (this.isEditMode) {
        const candidato = this.eleccion()?.candidatos.find(c => c.id === this.candidatoId);
        if (candidato && candidato.imagenes[i]) {
          imagenesFinales.push(candidato.imagenes[i]);
        }
      }
    }

    const eleccionId = this.route.snapshot.paramMap.get('id');
    if (!eleccionId) return;

    if (this.isEditMode) {
      const candidatoActualizado: Candidato = {
        ...this.candidatoForm.value,
        id: this.candidatoId!,
        imagenes: imagenesFinales
      };
      await this.eleccionService.editarCandidato(eleccionId, candidatoActualizado);
      Swal.fire('Actualizado', 'El candidato ha sido actualizado con éxito', 'success');
    } else {
      const nuevoCandidato: Candidato = {
        ...this.candidatoForm.value,
        id: crypto.randomUUID(),
        imagenes: imagenesFinales
      };
      await this.eleccionService.agregarCandidato(eleccionId, nuevoCandidato);
      Swal.fire('Creado', 'El candidato ha sido creado con éxito', 'success');
    }

    this.closeModal();
    this.isSubmitting = false;
  }

  async eliminarCandidato(candidatoId: string): Promise<void> {
    const eleccionId = this.route.snapshot.paramMap.get('id');
    if (!eleccionId) return;

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      await this.eleccionService.eliminarCandidato(eleccionId, candidatoId);
      Swal.fire('Eliminado', 'El candidato ha sido eliminado con éxito', 'success');
      // Refresh the election data
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.eleccionService.getEleccionById(id).subscribe(eleccion => {
          this.eleccion.set(eleccion);
          if (eleccion && eleccion.candidatos) {
            this.currentImageIndexes = eleccion.candidatos.map(() => 0);
            this.isImageLoading = eleccion.candidatos.map(() => false);
          }
        });
      }
    }
  }
}
