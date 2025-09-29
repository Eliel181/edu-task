import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ɵInternalFormsSharedModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { SchoolService } from '../../../core/services/school.service';
import { distinctUntilChanged, skip, Subject, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';
import { FirestoreService } from '../../../core/services/firestore.service';
import { Escuela } from '../../../core/interfaces/escuela.model';


declare const HSStaticMethods: any;
@Component({
  selector: 'app-school-management',
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './school-management.component.html',
  styleUrl: './school-management.component.css'
})
export class SchoolManagementComponent implements OnInit, OnDestroy {

  private escuelaService: SchoolService = inject(SchoolService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  private firestoreService: FirestoreService = inject(FirestoreService);
  directores = signal<Usuario[]>([]);

  router: Router = inject(Router);

  escuelaForm!: FormGroup;
  isSubmitting: boolean = false;

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

    // debugger
    //obtengo la inf del campo "sku"
    //pipe me permite concatenar varias operadores, cons esa operadores podremos manipular el dato del campo "sku"
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

  guardarCambios(): void {
    // debugger
    if (this.escuelaForm.invalid) {
      this.escuelaForm.markAllAsTouched();
      return;
    }

    const escuelaData = this.escuelaForm.value;
    const { cue } = escuelaData;

    if (this.isEditMode && this.escuelaId) {
      //modo actualización
      this.escuelaService.updateEscuela(this.escuelaId, escuelaData).then(res => {

        Swal.fire({
          title: 'Actualizado Exitosamente',
          text: 'Los datos de la Esc. se actualizaron exitosamente',
          icon: 'success'
        })

        this.router.navigate(['administracion/gestion-escuelas']);

      }).catch(err => {
        Swal.fire({
          icon: 'error',
          title: 'Datos NO Actualizados',
          text: 'Error al Actualizar los datos'
        })
      })
    } else {

      //modo nueva escuela
      this.escuelaService.crearEscuela(escuelaData).then(res => {
        Swal.fire({
          icon: 'success',
          title: 'Creado Exitosamente',
          text: 'Escuela Creada Exitosamente'
        })
        this.router.navigate(['administracion/gestion-escuelas']);
      }).catch(err => {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Error al Intentar Registrar Escuela'
        })
      })
    }
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