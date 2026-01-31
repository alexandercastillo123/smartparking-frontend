import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
    ParkingSpace,
    Reservation,
    ActiveReservation,
    ReservationHistory,
    CreateReservationRequest,
    CancelReservationRequest
} from '../models/parking.models';

@Injectable({
    providedIn: 'root'
})
export class ReservationService {
    private apiUrl = `${environment.apiUrl}/reservation`;

    constructor(private http: HttpClient) { }

    createReservation(request: CreateReservationRequest): Observable<Reservation> {
        return this.http.post<Reservation>(this.apiUrl, request);
    }

    getActiveReservation(): Observable<ActiveReservation> {
        return this.http.get<ActiveReservation>(`${this.apiUrl}/active`);
    }

    getReservationHistory(): Observable<ReservationHistory[]> {
        return this.http.get<ReservationHistory[]>(`${this.apiUrl}/history`);
    }

    getAllReservationHistory(): Observable<ReservationHistory[]> {
        return this.http.get<ReservationHistory[]>(`${this.apiUrl}/all-history`);
    }

    cancelReservation(reservationId: string, request: CancelReservationRequest): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.apiUrl}/${reservationId}/cancel`, request);
    }

    confirmReservation(reservationId: string): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.apiUrl}/${reservationId}/confirm`, {});
    }

    activateReservation(reservationId: string): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.apiUrl}/${reservationId}/activate`, {});
    }

    completeReservation(reservationId: string): Observable<Reservation> {
        return this.http.post<Reservation>(`${this.apiUrl}/${reservationId}/complete`, {});
    }
}
