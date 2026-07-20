import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { DxPopupModule, DxFilterBuilderModule, DxFilterBuilderComponent } from 'devextreme-angular';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FilterBuilderToolbarComponent } from './components/filter-builder-toolbar/filter-builder-toolbar.component';
import { WasabiService, FirmGridSetting } from './services/wasabi.service';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DxPopupModule,
    DxFilterBuilderModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    FilterBuilderToolbarComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  isPopupVisible = false;
  filtersData: Record<string, any> = {};
  selectedFilterKey: string | null = null;

  @Input() filterValue: DxFilterBuilderComponent['value'];

  fields: any[] = [
    { dataField: 'status', dataType: 'string', caption: 'Status' },
    { dataField: 'plan', dataType: 'string', caption: 'Plan' },
    { dataField: 'type', dataType: 'string', caption: 'Type' },
    { dataField: 'score', dataType: 'number', caption: 'Score' }
  ];

  @ViewChild('toolbar') toolbarComponent!: FilterBuilderToolbarComponent;

  constructor(private wasabiService: WasabiService) {}

  ngOnInit(): void {
    this.loadFilters();
  }

  loadFilters(): void {
    this.wasabiService.get().subscribe({
      next: (data: FirmGridSetting) => {
        this.filtersData = data.AdvancedFilters || {};
      },
      error: (err) => {
        console.error('Failed to load filters', err);
      }
    });
  }

  openPopup(): void {
    const keys = Object.keys(this.filtersData || {});
    if (keys.length > 0) {
      this.selectedFilterKey = keys[0];
      this.filterValue = this.filtersData[keys[0]] || null;
    } else {
      this.selectedFilterKey = null;
      this.filterValue = null;
    }
    this.isPopupVisible = true;
  }

  onSelectedKeyChange(newKey: string | null): void {
    this.selectedFilterKey = newKey;
    if (newKey) {
      this.filterValue = this.filtersData[newKey] || null;
    } else {
      this.filterValue = null;
    }
  }

  onQueryValueChange(newValue: any): void {
    const originalValue = this.selectedFilterKey ? (this.filtersData[this.selectedFilterKey] || null) : null;
    const isActuallyChanged = JSON.stringify(newValue) !== JSON.stringify(originalValue);

    this.filterValue = newValue;

    if (isActuallyChanged && this.toolbarComponent.mode === 'display') {
      if (this.selectedFilterKey) {
        this.toolbarComponent.enableEditMode();
      } else {
        this.toolbarComponent.enableAddMode();
      }
    }
  }

  handleRename(event: { oldKey: string; newKey: string }): void {
    const { oldKey, newKey } = event;
    if (!newKey) {
      return;
    }

    // Clone the filters dictionary to trigger Angular change detection
    const updatedFilters = { ...this.filtersData };
    const queryValueToSave = this.filterValue || 'status = "all"';

    if (!oldKey) {
      // Adding a brand new filter
      updatedFilters[newKey] = queryValueToSave;
    } else {
      updatedFilters[newKey] = queryValueToSave;
      if (oldKey !== newKey) {
        delete updatedFilters[oldKey];
      }
    }

    // POST to mock backend
    this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
      next: (response: FirmGridSetting) => {
        this.filtersData = response.AdvancedFilters || {};
        // Set selection to the saved item
        this.selectedFilterKey = newKey;
        this.filterValue = this.filtersData[newKey] || null;
      },
      error: (err) => {
        console.error('Failed to update filter name', err);
      }
    });
  }

  handleCancel(): void {
    if (this.selectedFilterKey) {
      this.filterValue = this.filtersData[this.selectedFilterKey] || null;
    } else {
      this.filterValue = null;
    }
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
          next: (response: FirmGridSetting) => {
            this.filtersData = response.AdvancedFilters || {};
            // Set selection to null as requested
            this.selectedFilterKey = null;
            this.filterValue = null;
          },
          error: (err) => {
            console.error('Failed to delete filter', err);
          }
        });
      }
    });
  }
}
