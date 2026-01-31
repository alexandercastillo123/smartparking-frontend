import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AbsenceCounter } from '../models/parking.models';

@Injectable({
    providedIn: 'root'
})
export class AbsenceService {
    private apiUrl = `${environment.apiUrl}/absence`;

    constructor(private http: HttpClient) { }

    getAbsenceCounter(): Observable<AbsenceCounter> {
        return this.http.get<AbsenceCounter>(`${this.apiUrl}/counter`);
    }
}
