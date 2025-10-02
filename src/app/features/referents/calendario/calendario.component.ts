import { Tarea } from './../../../core/interfaces/tarea.model';
import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CalendarComponent } from '@schedule-x/angular';
import { createCalendar, createViewList, createViewMonthAgenda, createViewMonthGrid } from '@schedule-x/calendar';
import { VisitaService } from '../../../core/services/visita.service';
import { SchoolService } from '../../../core/services/school.service';
import { AuthService } from '../../../core/services/auth.service';
import { Escuela } from '../../../core/interfaces/escuela.model';
import { range, Subject } from 'rxjs';
import { Visita } from '../../../core/interfaces/visita.model';
import { Timestamp } from '@angular/fire/firestore';
import type { CalendarEvent } from '@schedule-x/calendar';
import '@schedule-x/theme-default/dist/index.css';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-calendario',
  imports: [CalendarComponent, CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css'
})
export class CalendarioComponent implements OnInit, OnDestroy {
  private visitaService: VisitaService = inject(VisitaService);
  private formBuilder: FormBuilder = inject(FormBuilder);
  private escuelaService: SchoolService = inject(SchoolService);
  private authService: AuthService = inject(AuthService);
  visitaForm!: FormGroup;

  // Control de visibilidad
  isModalVisible = false;
  isCardVisible = false;

  // Estado y datos
  isEditMode = false;
  activeEvent: CalendarEvent | null = null;

  // Escuelas
  escuelas = signal<Escuela[]>([]);
  escuelaSeleccionada = signal<Escuela | undefined>(undefined);

  eventos = signal<CalendarEvent[]>([]);
  visitas = signal<Visita[]>([]);

  visitaForEdit = signal<Visita | undefined>(undefined);

  //cariables para manejar el rango de eventos, como filtro
  fechaInicio = signal<string>("");
  fechaFin = signal<string>("");

  private destroy$ = new Subject<void>();

  calendarApp = createCalendar({
    views: [createViewMonthGrid(), createViewMonthAgenda(), createViewList()],
    calendars: {
      Finalizada: {
        colorName: 'Finalizada',
        lightColors: { main: '#f91c45', container: '#ffd2dc', onContainer: '#59000d' },
        darkColors: { main: '#ffc0cc', container: '#a24258', onContainer: '#ffdee6' }
      },
      Curso: {
        colorName: 'Curso',
        lightColors: { main: '#1cf9b0', container: '#dafff0', onContainer: '#004d3d' },
        darkColors: { main: '#00c48c', container: '#004d3d', onContainer: '#a6fff1' }
      },
      Planificada: {
        colorName: 'Planificada',
        lightColors: { main: '#6985fd', container: '#e0e6ff', onContainer: '#001a66' },
        darkColors: { main: '#8ea0ff', container: '#3b4799', onContainer: '#e0e6ff' }
      }
    },
    locale: 'es-ES',
    callbacks: {
      //onRender: (range) => { this.formatearFecha(range)},
      onClickDate: (date) => { this.openModalForCreate(date); },
      onEventClick: (event: CalendarEvent) => { this.handleEventClick(event); },
      onClickAgendaDate: (date) => { this.openModalForCreate(date); },
      onRangeUpdate: (range) => { this.formatearFecha(range); },
    }
  });

  // visitas filtradas
  visitasFiltradas = computed(() => {
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    return this.visitas().filter(v => {
      return v.fecha >= inicio && v.fecha <= fin;
    });
  });

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.visitaService.getAllEscuelas().subscribe({
      next: (escuelas) => {
        this.escuelas.set(escuelas);
      }
    });

    this.visitaForm = this.formBuilder.group({
      escuelaId: ['', Validators.required],
      cueEscuela: [{ value: '', disabled: true }],
      nombreEscuela: [{ value: '', disabled: true }],
      direccionEscuela: [{ value: '', disabled: true }],
      fecha: [{ value: '', disabled: true }],
      horaInicio: ['09:00'],
      horaFin: ['10:00'],
      observaciones: [''],
      estado: ['Planificada'],
    });

    this.cargarVisitasEnCalendario();

    this.fechaInicio.set("2025-09-29");
    this.fechaFin.set("2025-11-02");
  }

  //funcion encargada de cargar las visitas en el calendario
  cargarVisitasEnCalendario() {
    const uidRte = this.authService.currentUser()?.uid;

    if (!uidRte) {
      return;
    }

    this.visitaService.getVisitasByRte(uidRte).subscribe(visitas => {
      const eventos = this.mapVisitasToEventos(visitas);
      this.visitas.set(visitas);
      console.log(eventos);

      this.calendarApp.events.set(eventos);
    });
  }

  //funcion para mapear una visita en un CalendarEvent
  mapVisitasToEventos(visitas: Visita[]): CalendarEvent[] {
    return visitas.map(v => {

      return {
        id: v.id!,
        title: `Visita ${v.nombreEscuela}`,
        start: `${v.fecha} ${v.horaInicio}`,
        end: `${v.fecha} ${v.horaFin}`,
        description: v.observaciones,
        calendarId: v.estado == 'En Curso' ? 'Curso' : v.estado,
      };
    });
  }

  formatearFecha(range: any) {
    const end = range.end;
    const fechaFin = end.split(" ")[0]; //"2025-09-29"
    this.fechaFin.set(fechaFin)

    const start = range.start;
    const fechaInicio = start.split(" ")[0]; //"2025-09-29"
    this.fechaInicio.set(fechaInicio)
  }

  //funcion encargada de traer las escuelas, para mostrarlas en el select de crearVisita
  cargarEscuelaSeleccionada(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    const escuelaIdSeleccionada = selectElement.value;

    if (escuelaIdSeleccionada) {
      this.escuelaService.getEscuelaById(escuelaIdSeleccionada).subscribe({
        next: (escuela) => {
          this.escuelaSeleccionada.set(escuela);
          if (escuela) {
            this.visitaForm.patchValue({
              cueEscuela: escuela.cue,
              nombreEscuela: escuela.nombreCompleto,
              direccionEscuela: escuela.direccion
            });
          }
        }
      });
    }
  }

  //funcion encargada de mostrar el modal, cada que se hace click sobre un dia en el calendario
  openModalForCreate(date: string) {
    this.isEditMode = false;
    this.isCardVisible = false;
    this.visitaForm.reset({
      fecha: date,
      horaInicio: '09:00',
      horaFin: '10:00',
      estado: 'Planificada',
      escuelaId: '',
    });
    this.visitaForm.get('fecha')?.enable();
    this.isModalVisible = true;
  }

  openModalForEdit(id: string) {
    let idVisitaEdit;

    if (!id) {
      return;
    }

    this.visitaService.getVisitaById(id).subscribe(data => {
      if (data) {
        this.visitaForm.patchValue(data);
        this.visitaForEdit.set(data);
      }
    });
    this.isEditMode = true;

    this.isModalVisible = true;
  }

  handleEventClick(event: CalendarEvent) {
    this.isModalVisible = false;
    this.activeEvent = event;
    this.isCardVisible = true;
  }

  //funcion encargada de cerrar el modal
  closeModal() {
    this.isModalVisible = false;
    this.isEditMode = false;
    this.activeEvent = null;
    this.visitaForm.reset();
  }

  //funcion valida que el form sea valido
  saveOrUpdateTask() {
    if (this.visitaForm.invalid) {
      this.visitaForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode) {
      this.actualizarVisita();
    } else {
      this.crearNuevaVisita();
    }
  }

  crearNuevaVisita() {
    const formValues = this.visitaForm.getRawValue();
    const nuevaVisita: Visita = {
      escuelaId: formValues.escuelaId,
      cueEscuela: formValues.cueEscuela,
      nombreEscuela: formValues.nombreEscuela,
      direccionEscuela: formValues.direccionEscuela,
      fecha: formValues.fecha,
      horaInicio: formValues.horaInicio,
      horaFin: formValues.horaFin,
      observaciones: formValues.observaciones,
      tareas: [],
      estado: formValues.estado,
      creadaPor: this.authService.currentUser()?.uid!,
      fechaDeCreacion: Timestamp.now(),
    };
    this.visitaService.crearVisita(nuevaVisita);

    this.closeModal();
  }

  actualizarVisita() {
    const idVisita = this.visitaForEdit()?.id;
    const formValues = this.visitaForm.getRawValue();

    const visitaParaActualizar: any = {
      escuelaId: formValues.escuelaId,
      cueEscuela: formValues.cueEscuela,
      nombreEscuela: formValues.nombreEscuela,
      direccionEscuela: formValues.direccionEscuela,
      horaInicio: formValues.horaInicio,
      horaFin: formValues.horaFin,
      observaciones: formValues.observaciones,
      tareas: this.visitaForEdit()?.tareas,
      estado: formValues.estado,
    };

    console.log(visitaParaActualizar);

    if (!idVisita) {
      return;
    }

    this.visitaService.updateVisita(idVisita, visitaParaActualizar).then(() => {
      Swal.fire('Actualizacion Exitosa', 'La tarea se actualizo con exito', 'success');
    });

    this.closeModal();
  }

  async eliminarVisita(idVisita: string) {
    if (!idVisita) {
      return;
    }

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará la visita!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: 'Cancelar',
    });

    if (result.isConfirmed) {
      try {
        await this.visitaService.eliminarVisita(idVisita);
        Swal.fire({
          title: '¡Eliminado!',
          text: 'Registro eliminado correctamente',
          icon: 'success'
        });
      } catch (error) {
        console.error('Error al eliminar el registro', error);
        Swal.fire({
          title: 'Error',
          text: 'Ocurrió un error al eliminar el registro',
          icon: 'error',
        });
      }
    }
  }
}
