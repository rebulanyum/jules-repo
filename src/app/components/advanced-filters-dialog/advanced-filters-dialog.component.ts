import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DxFilterBuilderModule } from 'devextreme-angular';
import { FilterBuilderToolbarComponent } from '../filter-builder-toolbar/filter-builder-toolbar.component';
import { WasabiService, FirmGridSetting } from '../../services/wasabi.service';
import { confirm } from 'devextreme/ui/dialog';

@Component({
  selector: 'advanced-filters-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    DxFilterBuilderModule,
    FilterBuilderToolbarComponent
  ],
  templateUrl: './advanced-filters-dialog.component.html',
  styleUrls: ['./advanced-filters-dialog.component.scss']
})
export class AdvancedFiltersDialogComponent implements OnInit {
  filtersData: Record<string, any> = {};
  selectedFilterKey: string | null = null;
  filterValue: any = [];

  fields: any[] = [
    { dataField: 'status', dataType: 'string', caption: 'Status' },
    { dataField: 'plan', dataType: 'string', caption: 'Plan' },
    { dataField: 'type', dataType: 'string', caption: 'Type' },
    { dataField: 'score', dataType: 'number', caption: 'Score' }
  ];

  @ViewChild('toolbar') toolbarComponent!: FilterBuilderToolbarComponent;

  constructor(
    private dialogRef: MatDialogRef<AdvancedFiltersDialogComponent>,
    private wasabiService: WasabiService,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

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

  closeDialog(): void {
    this.dialogRef.close();
  }

  onSelectedKeyChange(newKey: string | null): void {
    this.selectedFilterKey = newKey;
    if (newKey) {
      this.filterValue = this.filtersData[newKey] || [];
    } else {
      this.filterValue = [];
    }
  }

  onQueryValueChange(newValue: any): void {
    const originalValue = this.selectedFilterKey ? (this.filtersData[this.selectedFilterKey] || []) : [];
    const isActuallyChanged = JSON.stringify(newValue) !== JSON.stringify(originalValue);

    this.filterValue = newValue || [];

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

    const updatedFilters = { ...this.filtersData };
    const queryValueToSave = (this.filterValue && this.filterValue !== 'status = "all"') ? this.filterValue : [];

    if (!oldKey) {
      updatedFilters[newKey] = queryValueToSave;
    } else {
      updatedFilters[newKey] = queryValueToSave;
      if (oldKey !== newKey) {
        delete updatedFilters[oldKey];
      }
    }

    this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
      next: (response: FirmGridSetting) => {
        this.filtersData = response.AdvancedFilters || {};
        this.selectedFilterKey = newKey;
        this.filterValue = this.filtersData[newKey] || [];
      },
      error: (err) => {
        console.error('Failed to update filter name', err);
      }
    });
  }

  handleCancel(): void {
    if (this.selectedFilterKey) {
      this.filterValue = this.filtersData[this.selectedFilterKey] || [];
    } else {
      this.filterValue = [];
    }
  }

  handleDelete(key: string): void {
    if (!key) {
      return;
    }

    confirm('Are you sure you want to delete this filter?', 'Delete Confirmation').then((confirmed: boolean) => {
      if (confirmed) {
        const updatedFilters = { ...this.filtersData };
        delete updatedFilters[key];

        this.wasabiService.post('/api/filters', { AdvancedFilters: updatedFilters }).subscribe({
          next: (response: FirmGridSetting) => {
            this.filtersData = response.AdvancedFilters || {};
            this.selectedFilterKey = null;
            this.filterValue = [];
          },
          error: (err) => {
            console.error('Failed to delete filter', err);
          }
        });
      }
    });
  }
}
