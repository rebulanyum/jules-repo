import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DxPopupModule } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { WasabiService, WasabiData } from './services/wasabi.service';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DxPopupModule,
    MatButtonModule,
    MatIconModule,
    ToolbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  isPopupVisible = false;
  filtersData: Record<string, string> = {};
  selectedFilterKey: string | null = null;

  constructor(private wasabiService: WasabiService) {}

  ngOnInit(): void {
    this.loadFilters();
  }

  loadFilters(): void {
    this.wasabiService.get().subscribe({
      next: (data: WasabiData) => {
        this.filtersData = data.AdvancedFilters || {};
      },
      error: (err) => {
        console.error('Failed to load filters', err);
      }
    });
  }

  openPopup(): void {
    this.isPopupVisible = true;
  }

  handleRename(event: { oldKey: string; newKey: string; customValue?: string }): void {
    const { oldKey, newKey, customValue } = event;
    if (!newKey) {
      return;
    }

    // Clone the filters dictionary to trigger Angular change detection
    const updatedFilters = { ...this.filtersData };

    if (!oldKey) {
      // Adding a brand new filter when the list was empty or via Add/Copy Buttons
      updatedFilters[newKey] = customValue !== undefined ? customValue : 'status = "all"';
    } else {
      if (oldKey === newKey) {
        return;
      }
      const value = updatedFilters[oldKey];
      // Create new key and copy value
      updatedFilters[newKey] = value;
      // Delete old key
      delete updatedFilters[oldKey];
    }

    // POST to mock backend
    this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
      next: (response: WasabiData) => {
        this.filtersData = response.AdvancedFilters || {};
        // Set selection to the saved item
        this.selectedFilterKey = newKey;
      },
      error: (err) => {
        console.error('Failed to update filter name', err);
      }
    });
  }

  handleDelete(key: string): void {
    if (!key) {
      return;
    }

    // DevExtreme confirmation dialog
    confirm('Are you sure you want to delete this filter?', 'Delete Confirmation').then((confirmed: boolean) => {
      if (confirmed) {
        const updatedFilters = { ...this.filtersData };
        delete updatedFilters[key];

        // POST to mock backend
        this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
          next: (response: WasabiData) => {
            this.filtersData = response.AdvancedFilters || {};
            // Set selection to null as requested
            this.selectedFilterKey = null;
          },
          error: (err) => {
            console.error('Failed to delete filter', err);
          }
        });
      }
    });
  }
}
