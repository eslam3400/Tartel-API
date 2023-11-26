function getLastFourMonths() {
  const currentDate = new Date();
  const months = [];

  for (let i = 0; i < 4; i++) {
    const previousMonth = new Date(currentDate);
    previousMonth.setMonth(currentDate.getMonth() - i);
    months.push(previousMonth);
  }

  return months;
}

function getArabicMonthName(month) {
  const arabicMonthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
  ];

  return arabicMonthNames[month.getMonth()];
}

module.exports = { getLastFourMonths, getArabicMonthName }