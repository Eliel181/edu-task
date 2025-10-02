import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { SchoolService } from '../../../core/services/school.service';
import { distinctUntilChanged, skip, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../../../core/services/auth.service';
import { ActivityFeedService } from '../../../core/services/activity-feed.service';


declare const HSStaticMethods: any;
@Component({
  selector: 'app-school-management',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './school-management.component.html',
  styleUrl: './school-management.component.css'
})
export class SchoolManagementComponent implements OnInit, OnDestroy {
  private activityService: ActivityFeedService = inject(ActivityFeedService);
  private authService: AuthService = inject(AuthService);
  private escuelaService: SchoolService = inject(SchoolService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  directores = signal<Usuario[]>([]);

  router: Router = inject(Router);

  escuelaForm!: FormGroup;
  isSubmitting = signal<boolean>(false);

  isEditMode: boolean = false;
  escuelaId: string | null = null;

  private destroy$ = new Subject<void>();



  ngOnInit(): void {

    this.escuelaForm = this.formBuilder.group({
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      nombreCorto: ['', [Validators.required, Validators.minLength(3)]],
      cue: ['', [
        Validators.required,
        Validators.pattern(/^\d{6}-\d{2}$/)
      ]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      telefono: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      paginaWeb: [''],
      director: ['', [Validators.required]],
      matriculaTotal: ['', [Validators.required]],
      nivel: ['', [Validators.required]],
      cantAlumnos: ['', [Validators.required]],
      cantDocentes: ['', [Validators.required]],
      cantAdministrativos: ['', [Validators.required]],
      cantEmpleados: ['', [Validators.required]],
    });

    this.escuelaId = this.route.snapshot.paramMap.get('id')

    if (this.escuelaId) {
      this.isEditMode = true;

      this.escuelaService.getEscuelaById(this.escuelaId).subscribe({
        next: (escuela) => {
          if (escuela) {
            this.escuelaForm.patchValue(escuela);    setTimeout(() => HSStaticMethods?.autoInit());
          }
        }
      })
    }

    this.escuelaForm.get('cue')?.valueChanges
      .pipe(
        skip(1),
        distinctUntilChanged()
      ).subscribe(async (cue) => {
        if (cue && cue.length >= 9) {
          const idActual = this.escuelaId;

          const existe = await this.escuelaService.cueExists(cue, idActual!);
          const existeNuevo = await this.escuelaService.cueExists(cue);

          if (existe || existeNuevo) {
            this.escuelaForm.get('cue')?.setErrors({ cueDuplicado: true })
          } else {
            this.escuelaForm.get('cue')?.setErrors(null);
          }
        }
      });

    this.cargarDatos();
  }



  ngOnDestroy(): void {
    //aqui podemos limpiar las subscriptions
    this.destroy$.next();//emitimos un valor para completar el observable
    this.destroy$.complete();//completamos el observable
  }

  cargarDatos() {
  this.escuelaService.getDirectores()
    .pipe(takeUntil(this.destroy$))
    .subscribe(direct =>
      this.directores.set(direct)
    );

  }

  async guardarCambios(): Promise<void> {
    // debugger
    if (this.escuelaForm.invalid) {
      this.escuelaForm.markAllAsTouched();
      return;
    }

  this.isSubmitting.set(true);
    const escuelaData = this.escuelaForm.value;
    const currentUser = this.authService.currentUser();

    
    if (!currentUser) {
      this.isSubmitting.set(false);
      return;
    }

    try {
      if (this.isEditMode && this.escuelaId) {
        await this.escuelaService.updateEscuela(this.escuelaId, escuelaData);        
        await this.registrarActividadEdicionEscuela(currentUser, this.escuelaId, escuelaData.nombreCompleto);
        Swal.fire({ 
          title: 'Actualizado Exitosamente', 
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const docRef = await this.escuelaService.crearEscuela(escuelaData);
        await this.registrarActividadCreacionEscuela(currentUser, docRef.id, escuelaData.nombreCompleto);
        
        Swal.fire({ 
          title: 'Creado Exitosamente', 
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }

      this.router.navigate(['administracion/gestion-escuelas']);
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo guardar la escuela' });
    }finally {
      this.isSubmitting.set(false);
    }
  }

 // Métodos para registrar actividades
  private async registrarActividadCreacionEscuela(
    usuario: Usuario, 
    escuelaId: string, 
    nombreEscuela: string
  ): Promise<void> {
    await this.activityService.logActivity({
      actorId: usuario.uid,
      actorName: `${usuario.apellido} ${usuario.nombre}`,
      actorImage: usuario.perfil,
      action: 'create_school',
      entityType: 'school',
      entityId: escuelaId,
      entityDescription: nombreEscuela,
      details: `${usuario.nombre} ${usuario.apellido} registró una nueva escuela "${nombreEscuela}"`
    });
  }

  private async registrarActividadEdicionEscuela(
    usuario: Usuario, 
    escuelaId: string, 
    nombreEscuela: string
  ): Promise<void> {
    await this.activityService.logActivity({
      actorId: usuario.uid,
      actorName: `${usuario.apellido} ${usuario.nombre}`,
      actorImage: usuario.perfil,
      action: 'update_school',
      entityType: 'school',
      entityId: escuelaId,
      entityDescription: nombreEscuela,
      details: `${usuario.nombre} ${usuario.apellido} actualizó los datos de la escuela "${nombreEscuela}"`
    });
  }

  get nombreCompleto() { return this.escuelaForm.get('nombreCompleto'); }
  get nombreCorto() { return this.escuelaForm.get('nombreCorto'); }
  get cue() { return this.escuelaForm.get('cue'); }
  get direccion() { return this.escuelaForm.get('direccion'); }
  get telefono() { return this.escuelaForm.get('telefono'); }
  get email() { return this.escuelaForm.get('email'); }
  get director() { return this.escuelaForm.get('director'); }
  get matriculaTotal() { return this.escuelaForm.get('matriculaTotal'); }
  get nivel() { return this.escuelaForm.get('nivel'); }
  get cantAlumnos() { return this.escuelaForm.get('cantAlumnos'); }
  get cantDocentes() { return this.escuelaForm.get('cantDocentes'); }
  get cantAdministrativos() { return this.escuelaForm.get('cantAdministrativos'); }
  get cantEmpleados() { return this.escuelaForm.get('cantEmpleados'); }
}
