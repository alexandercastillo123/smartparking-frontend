import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class IoTSimulationService {
    private apiUrl = `${environment.apiUrl}/iot`;

    constructor(private http: HttpClient) { }

    simulateArrival(spaceCode: string): Observable<any> {
        // Ajustar la hora actual restando el offset de zona horaria para que se guarde correctamente
        const now = new Date();
        const localTime = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
        const adjustedTime = localTime.toISOString().slice(0, -1); // Remover la 'Z' para que se trate como local

        return this.http.post(`${this.apiUrl}/simulate-arrival/${spaceCode}`, {
            arrivalTime: adjustedTime
        });
    }

    simulateDeparture(spaceCode: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/simulate-departure/${spaceCode}`, {}, { responseType: 'text' });
    }

    simulateAbsence(reservationId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/simulate-absence/${reservationId}`, {});
    }

    getSpaceStatus(spaceCode: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/space-status/${spaceCode}`);
    }
}
