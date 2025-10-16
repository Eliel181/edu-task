import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Candidato } from '../../../core/interfaces/eleccion.model';

@Component({
  selector: 'app-eleccion-config',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './eleccion-config.component.html',
  styleUrls: ['./eleccion-config.component.css']
})
export class EleccionConfigComponent implements OnInit {
  isModalVisible = false;
  candidatoForm: FormGroup;

  constructor(private fb: FormBuilder) {
    this.candidatoForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(18)]],
      hobies: [''],
      propuesta: ['', Validators.required]
    });
  }

  ngOnInit(): void {}

  openModal() {
    this.candidatoForm.reset();
    this.isModalVisible = true;
  }

  closeModal() {
    this.isModalVisible = false;
  }

  onSubmit() {
    if (this.candidatoForm.valid) {
      console.log(this.candidatoForm.value);
      // Aquí llamaríamos al servicio para guardar el candidato
      this.closeModal();
    } else {
      console.log('Formulario no válido');
    }
  }
}
