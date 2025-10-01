import { inject, Injectable } from '@angular/core';
import { addDoc, collectionData, Firestore, limit, orderBy, query, Timestamp } from '@angular/fire/firestore';
import { collection } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { ActivityFeed } from '../interfaces/activity-feed.model';

@Injectable({
  providedIn: 'root'
})
export class ActivityFeedService {
  private firestore = inject(Firestore);
  private collectionRef = collection(this.firestore, 'activity_feed');

  async logActivity(activity: Omit<ActivityFeed, 'timestamp'>): Promise<void> {
    const newActivity: ActivityFeed = {
      ...activity,
      timestamp: Timestamp.now(),
    };
    await addDoc(this.collectionRef, newActivity);
  }

  getRecentActivities(limitCount = 5): Observable<ActivityFeed[]> {
    const q = query(this.collectionRef, orderBy('timestamp', 'desc'), limit(limitCount));
    return collectionData(q, { idField: 'id' }) as Observable<ActivityFeed[]>;
  }
}
