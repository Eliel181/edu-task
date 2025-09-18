import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Usuario } from '../../../core/interfaces/usuario.model';
import { SchoolService } from '../../../core/services/school.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-school-management',
  imports: [CommonModule],
  templateUrl: './school-management.component.html',
  styleUrl: './school-management.component.css'
})
export class SchoolManagementComponent implements OnInit, OnDestroy{
  private escuelaService:SchoolService = inject(SchoolService);
  private formBuilder:FormBuilder = inject(FormBuilder);
  private route = inject(ActivatedRoute);

  directores = signal<Usuario[]>([]);

  router:Router = inject(Router);

  escuelaForm: FormGroup;
  isSubmitting: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(){
    this.escuelaForm = this.formBuilder.group({
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngOnDestroy(): void {
    //aqui podemos limpiar las subscriptions
    this.destroy$.next();//emitimos un valor para completar el observable
    this.destroy$.complete();//completamos el observable
  }

  cargarDatos(){
    this.escuelaService.getDirectores()
      .pipe(takeUntil(this.destroy$))
      .subscribe(direct => this.directores.set(direct))
  }
}
