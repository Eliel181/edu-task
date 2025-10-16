import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { EleccionService } from '../../../core/services/eleccion.service';
import { Eleccion } from '../../../core/interfaces/eleccion.model';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-eleccion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './eleccion-list.component.html',
  styleUrls: ['./eleccion-list.component.css']
})
export class EleccionListComponent implements OnInit {
  isModalVisible = false;
  eleccionForm: FormGroup;
  elecciones = signal<Eleccion[]>([]);

  constructor(private fb: FormBuilder, private eleccionService: EleccionService) {
    this.eleccionForm = this.fb.group({
      titulo: ['', Validators.required],
      descripcion: [''],
      fechaInicio: ['', Validators.required],
      fechaFin: ['', Validators.required],
      candidatos: this.fb.array([]),
      votos: this.fb.array([]),
      estado: ['Pendiente']
    });
  }

  ngOnInit(): void {
    this.eleccionService.getElecciones().subscribe(elecciones => {
      this.elecciones.set(elecciones);
    });
  }

  openModal() {
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
    this.eleccionForm.reset({
      estado: 'Pendiente',
      criterios: [],
      candidatos: [],
      votos: []
    });
  }

  // get criterios(): FormArray {
  //   return this.eleccionForm.get('criterios') as FormArray;
  // }

  // addCriterio() {
  //   const criterioGroup = this.fb.group({
  //     nombre: ['', Validators.required]
  //   });
  //   this.criterios.push(criterioGroup);
  // }

  // removeCriterio(index: number) {
  //   this.criterios.removeAt(index);
  // }

  onSubmit() {
    if (this.eleccionForm.valid) {
      const nuevaEleccion: Eleccion = this.eleccionForm.value;
      this.eleccionService.crearEleccion(nuevaEleccion)
        .then(() => {
          console.log('Elección creada con éxito');
          this.closeModal();
        })
        .catch(err => {
          console.error('Error al crear la elección:', err);
        });
    } else {
      console.log('Formulario no válido');
      this.eleccionForm.markAllAsTouched(); // Marcar campos como tocados para mostrar errores
    }
  }
}

