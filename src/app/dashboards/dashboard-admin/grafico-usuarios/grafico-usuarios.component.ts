import { Component, inject, OnInit, signal } from '@angular/core';
import { ApexNonAxisChartSeries, ApexChart, ApexResponsive, ApexLegend, NgApexchartsModule, ApexDataLabels, ApexTheme, ApexFill, ApexStroke, ApexMarkers } from 'ng-apexcharts';
import { FirestoreService } from '../../../core/services/firestore.service';
import { RolUsuario, Usuario } from '../../../core/interfaces/usuario.model';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  responsive: ApexResponsive[];
  legend: ApexLegend;
  plotOptions: ApexPlotOptions;
  colors: string[];
  dataLabels: ApexDataLabels;
  theme: ApexTheme;
  fill: ApexFill;
  stroke: ApexStroke;
};

@Component({
  selector: 'app-grafico-usuarios',
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './grafico-usuarios.component.html',
  styleUrl: './grafico-usuarios.component.css'
})
export class GraficoUsuariosComponent implements OnInit {
  private firestoreService: FirestoreService = inject(FirestoreService);
  public chartOptions = signal<ChartOptions>({
    series: [], // se llena dinámicamente
    chart: {
      width: 280,
      type: 'donut',
      toolbar: { show: false },
      foreColor: '#000',
    },
    theme: {
      monochrome: { enabled: false }
    },
    stroke: {
      show: false, // Desactiva todos los bordes
      width: 0,
      colors: ['transparent'] // Hace los bordes transparentes
    },
    labels: ['Admin', 'Empleado', 'RTE', 'Director', 'Docente'],
    plotOptions: {
      pie: {
        donut: {
          size: '90%'
        }
      }
    },
    legend: {
      position: 'right',
      horizontalAlign: 'center',
      show: true,
      fontSize: '12px',
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
      labels: {
        colors: '#64748b',
        useSeriesColors: false // Esto evita que use los colores de las series para el texto
      }
    },
    // Paleta de colores personalizada
    colors: ['#9b5de5', '#f15bb5', '#f1c2d3', '#615eeb', '#fee440'],
    fill: {
      colors: ['#9b5de5', '#f15bb5', '#f1c2d3', '#615eeb', '#fee440']
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontFamily: 'Outfit, sans-serif',
        fontWeight: '600',
        colors: ['#fff']
      },
      dropShadow: { enabled: false }
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: 250 },
          legend: {
            position: 'bottom',
            horizontalAlign: 'center',
            fontSize: '11px'
          }
        }
      }
    ]
  });



  ngOnInit(): void {
    this.loadUsuarios();
    // Después de que los datos se han cargado y el signal se ha actualizado
    setTimeout(() => {
      console.log('Chart Options al finalizar:', this.chartOptions());
    }, 500); // Un pequeño retraso para asegurar que el signal se haya actualizado
  }

  loadUsuarios() {
    this.firestoreService.getCollection<Usuario>('usuarios')
      .pipe(
        map(usuarios => this.contarPorRol(usuarios))
      )
      .subscribe(({ labels, series }) => {
        this.chartOptions.set({
          ...this.chartOptions(),
          labels,
          series
        });
      });
  }

  contarPorRol(usuarios: Usuario[]) {
    const roles: RolUsuario[] = ['Admin', 'Empleado', 'RTE', 'Director', 'Docente'];
    const series = roles.map(rol => usuarios.filter(u => u.rol === rol).length);
    return { labels: roles, series };
  }
}
