import * as moment from 'moment'

export class DateUtil {

  static currentLocalDate(): moment.Moment {
    return moment.utc().subtract(5, 'h')
  }

  currentLocalTimeToNumber(): number {
    const currentDate = DateUtil.currentLocalDate()
    const h = currentDate.get('hour')
    const m = currentDate.get('minutes')
    return Number(`${h}.${m}`);
  }
}