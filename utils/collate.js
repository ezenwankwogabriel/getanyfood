const { uniq, groupBy, sortBy } = require('lodash');

function collate(array) {
  const sortedArray = sortBy(array, ({ month, year }) => `${year}${month}`);
  const byYear = groupBy(array, 'year');
  const result = [];
  Object.keys(byYear).forEach((year) => {
    const byMonth = groupBy(byYear[year], 'month');
    Object.keys(byMonth).forEach((month) => {
      result.push(
        byMonth[month].reduce(
          ({ amount: totalAmount }, { month, year, amount }) => ({
            month,
            year,
            amount: totalAmount + amount,
          }),
          { month, year, amount: 0 },
        ),
      );
    });
  });
  return result;
}

module.exports = collate;
