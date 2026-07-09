import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

export interface WasabiData {
  AdvancedFilters: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class WasabiService {
  // We keep an in-memory mock database state so GET matches the last POST state
  private state$ = new BehaviorSubject<WasabiData>({
    AdvancedFilters: {
      'Active Users Only': 'status = "active"',
      'Enterprise Customers': 'plan = "enterprise"',
      'Pending Reviews': 'status = "pending" AND type = "review"',
      'High Value Leads': 'score > 80'
    }
  });

  constructor() {}

  /**
   * Mock HTTP GET request
   * Returns an Observable containing WasabiData
   */
  get(url?: string): Observable<WasabiData> {
    // Return a copy of the state to simulate standard REST GET behavior
    return this.state$.asObservable().pipe(
      map(data => JSON.parse(JSON.stringify(data)))
    );
  }

  /**
   * Mock HTTP POST request
   * Saves the updated JSON state
   */
  post(url: string, body: WasabiData): Observable<WasabiData> {
    // Update our simulated "database" state
    const newState = JSON.parse(JSON.stringify(body));
    this.state$.next(newState);
    // Return the updated state wrapped in an Observable to simulate response
    return new BehaviorSubject<WasabiData>(newState).asObservable();
  }
}
