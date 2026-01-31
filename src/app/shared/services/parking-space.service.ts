import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ParkingSpace } from '../models/parking.models';

@Injectable({
    providedIn: 'root'
})
export class ParkingSpaceService {
    private apiUrl = `${environment.apiUrl}/space-iot/parking-spaces`;

    constructor(private http: HttpClient) { }

    getAllSpaces(): Observable<ParkingSpace[]> {
        return this.http.get<ParkingSpace[]>(this.apiUrl);
    }

    getSpaceByCode(code: string): Observable<ParkingSpace> {
        return this.http.get<ParkingSpace>(`${this.apiUrl}/${code}`);
    }

    getAvailableSpaces(): Observable<ParkingSpace[]> {
        return this.http.get<ParkingSpace[]>(`${this.apiUrl}/status/available`);
    }
}
