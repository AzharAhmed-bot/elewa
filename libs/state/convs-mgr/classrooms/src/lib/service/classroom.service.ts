import { Injectable } from '@angular/core';

import { concatMap, of } from 'rxjs';

import { Classroom } from '@app/model/convs-mgr/classroom';

import { ClassroomStore } from '../store/classroom.store';

@Injectable({
  providedIn:  'root',
})
export class ClassroomService {
  constructor(private _classroom$$: ClassroomStore) {}

  getAllClassrooms() {
    return this._classroom$$.get();
  }

  addClassroom(classroom: Classroom) {
    return this._classroom$$.add(classroom);
  }

  getSpecificClassroom(id: string) {
    return this._classroom$$.getOne(id);
  }

  deleteClassroom(classroom: Classroom) {
    return this._classroom$$.remove(classroom);
  }

  updateClassroom(classroom: Classroom) {
    return this._classroom$$.update(classroom);
  }

  addUsersToClass(users: string[], classId: string) {
    return this.getSpecificClassroom(classId)
    .pipe(concatMap((cr)=> {
      if (cr) {
        if(cr.users) {
          cr.users.push(...users);
        } else {
          cr.users = [...users];
        }
        return this._classroom$$.update(cr);
      } else 
      return of({})
    }))
   }
}
