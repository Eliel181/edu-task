import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { ImagenCandidato } from './../interfaces/eleccion.model'
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CloudinaryService {
  private http: HttpClient = inject(HttpClient);

  private cloudName = 'mrpotato';
  private uploadPreset = 'mr_myupload';
  private cloudinaryUrl = 'https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload';


  uploadImage(file: File): Observable<ImagenCandidato> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);

    return this.http.post<{ public_id: string, secure_url: string }>(this.cloudinaryUrl, formData)
      .pipe(
        map(response => {
          return {
            public_id: response.public_id,
            secure_url: response.secure_url
          };
        })
      );
  }
}
