import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService } from '../../../../shared/services/reservation.service';
import { ReservationHistory } from '../../../../shared/models/parking.models';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-admin-reports',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './admin-reports.component.html',
    styleUrl: './admin-reports.component.scss'
})
export class AdminReportsComponent implements OnInit {
    history: ReservationHistory[] = [];
    filteredHistory: ReservationHistory[] = [];
    isLoading = true;
    selectedPeriod: 'today' | 'week' | 'month' | 'all' = 'all';
    userFilter: string | null = null;

    // Metrics
    metrics = {
        total: 0,
        completed: 0,
        cancelled: 0,
        absences: 0,
        avgDuration: '0m',
        totalRevenue: 0
    };

    chartData: { label: string, value: number, height: number }[] = [];

    constructor(
        private reservationService: ReservationService,
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
        this.route.queryParamMap.subscribe(params => {
            this.userFilter = params.get('user');
            this.loadData();
        });
    }

    loadData(): void {
        this.isLoading = true;
        this.reservationService.getAllReservationHistory().subscribe({
            next: (data) => {
                console.log('AdminReports: Data received', data);
                this.history = data.map(res => ({
                    ...res,
                    startTime: this.parseDate(res.startTime),
                    endTime: res.endTime ? this.parseDate(res.endTime) : undefined
                }));
                this.calculateChartData();
                this.filterData(this.selectedPeriod);
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading reports data', err);
                this.isLoading = false;
            }
        });
    }

    calculateChartData(): void {
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const now = new Date();
        const last7Days = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(now.getDate() - i);
            const label = i === 0 ? 'Hoy' : days[date.getDay()];

            const count = this.history.filter(res => {
                const resDate = new Date(res.startTime);
                return resDate.toDateString() === date.toDateString();
            }).length;

            last7Days.push({ label, value: count, height: 0 });
        }

        const max = Math.max(...last7Days.map(d => d.value), 1);
        this.chartData = last7Days.map(d => ({
            ...d,
            height: Math.max((d.value / max) * 200, 10) // 200px is max height
        }));
    }

    filterData(period: 'today' | 'week' | 'month' | 'all'): void {
        this.selectedPeriod = period;
        const now = new Date();

        this.filteredHistory = this.history.filter(res => {
            const resDate = new Date(res.startTime);

            // Filtro por usuario (case-insensitive y robusto)
            if (this.userFilter) {
                const search = this.userFilter.toLowerCase().trim();
                const userEmail = (res.userEmail || '').toLowerCase().trim();
                const userName = (res.userName || '').toLowerCase().trim();
                if (userEmail !== search && userName !== search) {
                    return false;
                }
            }

            if (period === 'today') {
                return resDate.toDateString() === now.toDateString();
            } else if (period === 'week') {
                const lastWeek = new Date();
                lastWeek.setDate(now.getDate() - 7);
                return resDate >= lastWeek;
            } else if (period === 'month') {
                return resDate.getMonth() === now.getMonth() && resDate.getFullYear() === now.getFullYear();
            }
            return true;
        });

        this.calculateMetrics();
    }

    calculateMetrics(): void {
        const total = this.filteredHistory.length;
        const completed = this.filteredHistory.filter(h => h.status === 'completed').length;
        const cancelled = this.filteredHistory.filter(h => h.status === 'cancelled').length;
        const expired = this.filteredHistory.filter(h => h.status === 'expired').length;

        let totalMinutes = 0;
        this.filteredHistory.filter(h => h.status === 'completed' && h.endTime).forEach(h => {
            const start = new Date(h.startTime).getTime();
            const end = new Date(h.endTime!).getTime();
            totalMinutes += (end - start) / (1000 * 60);
        });

        const avgMinutes = completed > 0 ? Math.round(totalMinutes / completed) : 0;

        this.metrics = {
            total,
            completed,
            cancelled,
            absences: expired,
            avgDuration: avgMinutes > 60 ? `${Math.floor(avgMinutes / 60)}h ${avgMinutes % 60}m` : `${avgMinutes}m`,
            totalRevenue: 0 // Eliminado según feedback
        };
    }

    calculateDuration(res: ReservationHistory): string {
        if (res.status === 'completed' && res.startTime && res.endTime) {
            const start = new Date(res.startTime).getTime();
            const end = new Date(res.endTime).getTime();
            const diffMs = end - start;
            const diffMins = Math.round(diffMs / (1000 * 60));

            if (diffMins < 60) return `${diffMins}m`;
            const hours = Math.floor(diffMins / 60);
            const mins = diffMins % 60;
            return `${hours}h ${mins}m`;
        }
        return '-';
    }

    getPeriodLabel(period: string): string {
        switch (period) {
            case 'today': return 'hoy';
            case 'week': return 'esta semana';
            case 'month': return 'este mes';
            case 'all': return 'todo el tiempo';
            default: return period;
        }
    }

    private parseDate(dateStr: string | Date | undefined | null): Date {
        if (!dateStr) return new Date(0);
        if (dateStr instanceof Date && !isNaN(dateStr.getTime())) return dateStr;

        let str = dateStr.toString().trim();
        if (str.includes(' ') && !str.includes('T')) {
            str = str.replace(' ', 'T');
        }

        // Si no tiene zona horaria, forzamos UTC
        if (!str.endsWith('Z') && !str.includes('+') && str.length > 10) {
            str += 'Z';
        }

        const d = new Date(str);
        if (isNaN(d.getTime())) {
            // Intentar parsear como local si falló con Z
            const fallback = new Date(dateStr.toString());
            return isNaN(fallback.getTime()) ? new Date(0) : fallback;
        }
        return d;
    }
}
