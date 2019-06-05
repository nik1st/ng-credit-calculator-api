let calculateAnnCredit = function(amountCredit, timeCredit, percentCredit, startingDate) {
    let pay = Math.round(100*(amountCredit * (percentCredit / 1200 + (percentCredit / 1200) /
     ((Math.pow((1 + percentCredit / 1200),timeCredit)) - 1))))/100;

    let creditMas = [],
      dateOfPay = startingDate,
      debtOfCredit = amountCredit,
      mainDebt,
      amountOfPercent,
      numOfPay,
      previousDate = new Date(startingDate);

    for(let i = 1; i<=timeCredit; i++){
    numOfPay = i;
    dateOfPay = plusOneMounth(startingDate, i);
    amountOfPercent = (debtOfCredit * (percentCredit/100)/365) * daysBetweenDates(previousDate, dateOfPay);
    mainDebt = pay - amountOfPercent;
    debtOfCredit -= mainDebt;

    if(debtOfCredit < mainDebt){
      pay += debtOfCredit;
      mainDebt = pay - amountOfPercent;
      debtOfCredit = 0;
    }
    previousDate = new Date(dateOfPay);
    creditMas.push({numOfPay: numOfPay, pay: pay, mainDebt: mainDebt, amountOfPercent: amountOfPercent, debtOfCredit: debtOfCredit, dateOfPay: dateOfPay});
    }
    return creditMas;
  }

   function daysBetweenDates (leftDate, rightDate) {
    return Math.round((new Date(rightDate).getTime() - new Date(leftDate).getTime())/1000/60/60/24);
  }

  function plusOneMounth(currentPaymentsDate, time) {
    let currentDate = new Date(currentPaymentsDate);
    let dateOfNextMonth = new Date(currentPaymentsDate);
    dateOfNextMonth.setMonth(dateOfNextMonth.getMonth() + time);
    
    if(currentDate.getDate() != dateOfNextMonth.getDate()){
      let modifiedDate = new Date(currentDate);
      modifiedDate.setMonth(modifiedDate.getMonth() + time);
      modifiedDate.setDate(1);
      return modifiedDate;
    }
    return dateOfNextMonth;
  }

  let calculateDifCredit = function(amountCredit, timeCredit, percentCredit, startingDate) {
    let mainDebt = amountCredit / timeCredit;

    let creditMas = [],
      dateOfPay = startingDate,
      debtOfCredit = amountCredit,
      amountOfPercent,
      numOfPay,
      previousDate = new Date(startingDate);

      for(let i = 1; i<=timeCredit; i++){
        numOfPay = i;
        dateOfPay = plusOneMounth(startingDate, i);
        amountOfPercent = debtOfCredit * (percentCredit/100) * (daysBetweenDates(previousDate, dateOfPay) / 365);
        pay = mainDebt + amountOfPercent;
        debtOfCredit -= mainDebt;
    
        if(debtOfCredit < mainDebt){
          pay += debtOfCredit;
          debtOfCredit = 0;
        }
        previousDate = new Date(dateOfPay);
        creditMas.push({numOfPay: numOfPay, pay: pay, mainDebt: mainDebt, amountOfPercent: amountOfPercent, debtOfCredit: debtOfCredit, dateOfPay: dateOfPay});
        }
        return creditMas;
  }

  function calculateSum(creditMas) {
    let sumOfPercents = 0;
    for(let i = 0; i < creditMas.length; i++) {
      sumOfPercents += creditMas[i].amountOfPercent;
    }
    return sumOfPercents;
  }
module.exports = {
  calculateAnnCredit,
  calculateDifCredit,
  calculateSum
};

