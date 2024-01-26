import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSort, Sort } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { Chart } from 'chart.js';
import { SubSink } from 'subsink';
import { map, switchMap, Observable } from 'rxjs';
import { Timestamp } from 'firebase-admin/firestore';

import { Assessment } from '@app/model/convs-mgr/conversations/assessments';

import { EndUserService } from '@app/state/convs-mgr/end-users';
import { EndUserDetails } from '@app/state/convs-mgr/end-users';
import { ActiveAssessmentStore, AssessmentQuestionService } from '@app/state/convs-mgr/conversations/assessments';

import { BreadcrumbService } from '@app/elements/layout/ital-bread-crumb'; 
import { iTalBreadcrumb } from '@app/model/layout/ital-breadcrumb';

import { AssessmentMetricsService } from '../../services/assessment-metrics.service';
import { pieChartOptions } from '../../utils/chart.util';

@Component({
  selector: 'app-assessment-results',
  templateUrl: './assessment-results.component.html',
  styleUrls: ['./assessment-results.component.scss'],
})
export class AssessmentResultsComponent implements OnInit, OnDestroy {
  chart: Chart;

  id: string;
  assessment: Assessment;

  dataSource: MatTableDataSource<EndUserDetails>;
  itemsLength: number;
  assessmentResults = ['index', 'name', 'phone', 'startedOn', 'finishedOn', 'score', 'scoreCategory'];
  pageTitle: string;

  highestScore: number;
  lowestScore: number;
  averageScore: number | string;
  totalQuestions: number;

  breadcrumbs$: Observable<iTalBreadcrumb[]>;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild(MatPaginator) paginator: MatPaginator;

  private _sBs = new SubSink();

  constructor(
    private _router: Router,
    private _liveAnnouncer: LiveAnnouncer,
    private _activeAssessment$$: ActiveAssessmentStore,
    private _assessmentQuestion: AssessmentQuestionService,
    private _aMetrics: AssessmentMetricsService,
    private _endUserService: EndUserService,
    private _breadcrumbService: BreadcrumbService
  ) {
    this.breadcrumbs$ = this._breadcrumbService.breadcrumbs$;
  };

  ngOnInit() {
    this._sBs.sink = this._assessmentQuestion.getQuestions$().subscribe((qstns) => this.totalQuestions = qstns.length);
    this.getMetrics();
  };

  getMetrics() {
    this._sBs.sink = this._activeAssessment$$.get()
      .pipe(
        switchMap((assessment) => {
          this.assessment = assessment
          this.pageTitle = `Assessments / ${assessment.title} / results`;

          return this._endUserService.getUserDetailsAndTheirCursor().pipe(
            map((endUsers) => {
              const { data, chartData, scores } = this._aMetrics.computeMetrics(endUsers,assessment);
              this.itemsLength = data.length;
              this.initDataSource(data);
              this.computeScores(scores);
              this._loadChart(chartData);
            })
          );
        })
      )
      .subscribe();
  };

  private initDataSource(data:EndUserDetails[]) {
    this.dataSource = new MatTableDataSource(data);
    this.dataSource.sortingDataAccessor = (endUser, property) => {
      switch(property) {
        case 'phoneNumber': 
          return endUser.user.phoneNumber;
        case 'startedOn': 
          return endUser.selectedAssessmentCursor?.startedOn;
        case 'score': 
          return endUser.selectedAssessmentCursor?.score;
        case 'finishedOn': 
          return endUser.selectedAssessmentCursor?.finishedOn;
        default:
          return endUser[property];
      }
    };

    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  private _loadChart(chartData: number[]) {
    // don't generate graph if no data is present
    const isData = chartData.find(score => score > 1)

    if (this.chart) this.chart.destroy();

    if (!isData) {
      return this._drawEmptyChart();
    };

    return new Chart('chart-ctx', {
      type: 'pie',
      data: {
        labels: ['Pass (75-100)','Average (50-74)', 'In Progress', 'Below Average (35-49)','Fail (0-34)'],
        datasets: [{
          data: chartData,
          backgroundColor: [
            'rgb(0, 144, 0)',
            'rgb(100, 24, 195)',
            'rgb(2, 179, 254)',
            'rgb(255, 171, 45)',
            'rgb(255, 0, 0)',
          ],
          hoverOffset: 4
        }]
      },
      options: pieChartOptions
    });
  }

  private _drawEmptyChart() {
    return new Chart('chart-ctx', {
      type: 'doughnut',
      data: {
        labels: ['No Metrics Available'],
        datasets: [{
          data: [100],
          backgroundColor: ['rgba(128, 128, 128, 1)'],
          hoverOffset: 4
        }]
      },
      options: pieChartOptions
    })
  }

  computeScores(scores:number[]) {
    if (!scores.length) return;

    this.highestScore = Math.max(...scores);
    this.lowestScore = Math.min(...scores);

    const sum = scores.reduce((prev, next) => prev + next);
    this.averageScore = (sum/scores.length).toFixed(2);
  };

  sortData(sortState: Sort) {
    if (sortState.direction) {
      this._liveAnnouncer.announce(`Sorted ${sortState.direction} ending`);
    } else {
      this._liveAnnouncer.announce('Sorting cleared');
    }
  }

  formatDate(timeStamp: Timestamp): string {
    if (!timeStamp) return 'In progress';
    const date = new Date(timeStamp.seconds * 1000);

    const year = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    return  `${year} ${time}`;
  }

  modifyTitle(title: string) {
    const firstChar = title.charAt(0).toUpperCase();
    const restChars = title.slice(1).toLowerCase();

    return `${firstChar}${restChars}`
  }

  addClass(endUser: EndUserDetails) {
    if (endUser.scoreCategory === 'In progress') {
      return 'in-progress'
    } else if (endUser.scoreCategory === 'Below Average') {
      return 'below-average'
    } else return endUser.scoreCategory
  }

  searchTable(event: Event){
    const searchValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = searchValue.trim();
  }

  goBack() {
    this._router.navigate(['/assessments'])
  }

  edit() {
    this._router.navigate(['/assessments', this.assessment.id], { queryParams: { mode: 'edit' }})
  }

  ngOnDestroy() {
    this._sBs.unsubscribe();
    this.chart?.destroy();
  }
}
