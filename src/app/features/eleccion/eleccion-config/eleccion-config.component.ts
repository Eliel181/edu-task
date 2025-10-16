import { Component, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Candidato, Eleccion, ImagenCandidato } from '../../../core/interfaces/eleccion.model';
import { ActivatedRoute } from '@angular/router';
import { EleccionService } from '../../../core/services/eleccion.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';

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

  openModal() {
    this.candidatoForm.reset();
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
      }
    }

    const nuevoCandidato: Candidato = {
      ...this.candidatoForm.value,
      id: crypto.randomUUID(),
      imagenes: imagenesFinales
    };

    const eleccionId = this.route.snapshot.paramMap.get('id');
    if (eleccionId) {
      await this.eleccionService.agregarCandidato(eleccionId, nuevoCandidato);
      this.closeModal();
    }
    this.isSubmitting = false;
  }
}


// export class ProductManagementComponent implements OnInit {
//   private formBuilder: FormBuilder = inject(FormBuilder);
//   private router: Router = inject(Router);
//   private route: ActivatedRoute = inject(ActivatedRoute);
//   private productService: ProductService = inject(ProductService);
//   private cloudinaryService: CloudinaryService = inject(CloudinaryService);

//   productForm: FormGroup;
//   isEditMode = false;
//   isLoading = true;
//   isSubmitting = false;

//   private archivosParaSubir: (File | null)[] = [null, null, null];

//   vistasPrevias: (string | null)[] = [null, null, null];

//   private imagenesExistentes: ImagenProducto[] = [];

//   private productoId: string | null = null;

//   constructor() {

//     this.productForm = this.formBuilder.group({
//       nombre: ['', Validators.required],
//       descripcion: [''],
//       precio: [0, [Validators.required, Validators.min(0)]],
//       stock: [0, [Validators.required, Validators.min(0)]],
//       categoria: ['Musica', Validators.required],
//       destacado: [false],
//     });
//   }

//   ngOnInit(): void {

//     this.productoId = this.route.snapshot.paramMap.get('id');

//     if (this.productoId) {
//       this.isEditMode = true;
//       this.productService.getProductoById(this.productoId).then(producto => {
//         if (producto) {
//           this.poblarFormulario(producto);
//         } else {
//           console.error('Producto no encontrado con el ID:', this.productoId);
//           this.router.navigate(['/admin/productos']);
//         }
//         this.isLoading = false;
//       });
//     } else {
//       this.isLoading = false;
//       this.actualizarFormularioPorCategoria('Musica');
//     }
//     this.productForm.get('categoria')?.valueChanges.subscribe(categoria => {
//       this.actualizarFormularioPorCategoria(categoria);
//     });


//   }

//   poblarFormulario(producto: ProductoTienda): void {
//     this.actualizarFormularioPorCategoria(producto.categoria);
//     this.productForm.get('categoria')?.setValue(producto.categoria);

//     this.productForm.patchValue(producto);

//     this.imagenesExistentes = producto.imagenes;
//     producto.imagenes.forEach((img, i) => {
//       if (i < 3) this.vistasPrevias[i] = img.secure_url;
//     });

//     if (producto.categoria === 'Ropa') {
//       producto.variantes.forEach(v => this.agregarVariante(v));
//     } else if (producto.categoria === 'Musica' && producto.listaCanciones) {
//       producto.listaCanciones.forEach(c => this.agregarCancion(c));
//     }
//   }



//   onFileSelected(event: any, index: number): void {
//     const file = event.target.files?.[0];
//     if (!file) return;

//     this.archivosParaSubir[index] = file;

//     const reader = new FileReader();
//     reader.readAsDataURL(file);
//     reader.onload = () => {
//       this.vistasPrevias[index] = reader.result as string;
//     };
//   }


//   async guardarProducto(): Promise<void> {
//     if (this.productForm.invalid) {
//       this.productForm.markAllAsTouched();
//       Swal.fire({
//         title: 'Campos incompletos',
//         text: 'Por favor, completa todos los campos requeridos.',
//         icon: 'warning',
//         confirmButtonColor: '#3085d6',
//         confirmButtonText: 'Entendido'
//       });
//       return;
//     }
//     this.isSubmitting = true;

//     try {

//       const imagenesSubidas: (ImagenProducto | null)[] = [null, null, null];
//       for (let i = 0; i < this.archivosParaSubir.length; i++) {
//         const archivo = this.archivosParaSubir[i];
//         if (archivo) {
//           const resultado = await firstValueFrom(this.cloudinaryService.uploadImage(archivo));
//           imagenesSubidas[i] = resultado;
//         }
//       }

//       const imagenesFinales: ImagenProducto[] = [];
//       for (let i = 0; i < 3; i++) {
//         if (imagenesSubidas[i]) {
//           imagenesFinales.push(imagenesSubidas[i]!);
//         } else if (this.imagenesExistentes[i]) {
//           imagenesFinales.push(this.imagenesExistentes[i]);
//         }
//       }

//       const formData = this.productForm.getRawValue();
//       const datosFinales = {
//         ...formData,
//         imagenes: imagenesFinales
//       };

//       if (this.isEditMode) {
//         await this.productService.updateProducto(this.productoId!, datosFinales);
//         Swal.fire({
//           title: '¡Actualizado!',
//           text: 'El producto ha sido actualizado con éxito.',
//           icon: 'success',
//           timer: 2000,
//           showConfirmButton: false
//         });
//       } else {
//         await this.productService.addProducto(datosFinales);
//         Swal.fire({
//           title: '¡Creado!',
//           text: 'El producto ha sido creado con éxito.',
//           icon: 'success',
//           timer: 2000,
//           showConfirmButton: false
//         });
//       }
//       this.router.navigate(['/product-list']);

//     } catch (error) {
//       console.error('Error al guardar el producto:', error);
//       Swal.fire({
//         title: 'Error',
//         text: 'Ocurrió un error al intentar guardar el producto. Por favor, inténtalo de nuevo.',
//         icon: 'error',
//         confirmButtonText: 'Cerrar'
//       });
//     } finally {
//       this.isSubmitting = false;    }
//   }

//   get variantes(): FormArray { return this.productForm.get('variantes') as FormArray; }
//   get listaCanciones(): FormArray { return this.productForm.get('listaCanciones') as FormArray; }

//   actualizarFormularioPorCategoria(categoria: 'Musica' | 'Ropa' | null): void {
//     ['formato', 'nombreAlbum', 'fechaLanzamiento', 'listaCanciones', 'variantes'].forEach(ctrl => this.productForm.removeControl(ctrl));

//     if (categoria === 'Musica') {
//       this.productForm.addControl('formato', this.formBuilder.control('', Validators.required));
//       this.productForm.addControl('nombreAlbum', this.formBuilder.control('', Validators.required));
//       this.productForm.addControl('fechaLanzamiento', this.formBuilder.control('', Validators.required));
//       this.productForm.addControl('listaCanciones', this.formBuilder.array([]));
//     } else if (categoria === 'Ropa') {
//       this.productForm.addControl('variantes', this.formBuilder.array([], [Validators.required, Validators.minLength(1)]));
//       if (!this.isEditMode) {
//         this.agregarVariante();
//       }
//     }
//   }

//   agregarVariante(variante?: VarianteRopa): void {
//     if (!this.productForm.get('variantes')) {
//       this.productForm.addControl('variantes', this.formBuilder.array([]));
//     }
//     (this.productForm.get('variantes') as FormArray).push(this.formBuilder.group({
//       talla: [variante?.talla || 'M', Validators.required],
//       color: [variante?.color || 'Negro', Validators.required],
//       stock: [variante?.stock || 0, [Validators.required, Validators.min(0)]]
//     }));
//   }

//   eliminarVariante(index: number): void { this.variantes.removeAt(index); }

//   agregarCancion(nombre: string = ''): void { this.listaCanciones.push(this.formBuilder.control(nombre, Validators.required)); }
//   eliminarCancion(index: number): void { this.listaCanciones.removeAt(index); }
// }
