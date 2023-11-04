import asyncHandler from 'express-async-handler'
import Loan from "../models/loan.js";

const MakePayment = asyncHandler(async (req, res) => {
    const { customer_id, loan_id, amount } = req.body;

    const loan = await Loan.findOne({ where: { customer_id: customer_id, loan_id: loan_id } });

if (!loan) {
    return res.status(404).json({ error: 'Loan not found' });
}

// Access loan data from the dataValues property
const loanData = loan.dataValues;
    
 
    // Check if the amount paid is greater than the monthly EMI.
     if (amount >= loanData.monthly_payment) {

        // Recalculate the monthly EMI based on the remaining loan amount and tenure.
        let remainingTerms = loanData.tenure-loanData.emis_paid_on_time
        const remainingTenure = remainingTerms * loanData.monthly_payment - amount;
        const newTotalEmi = remainingTenure /(remainingTerms-1);
        console.log(loan,"yeah",newTotalEmi,"yeah")
        // Update loan.emi_amount with the new EMI amount.
        
        loanData.emis_paid_on_time;
        await Loan.update(
            {
              emis_paid_on_time: loanData.emis_paid_on_time+1,
              monthly_payment: newTotalEmi,
            },
            {
              where: { customer_id: customer_id, loan_id: loan_id },
            }
          );
    
        // Return an appropriate response to the user, indicating the status of the payment.
        return res.json({ message: 'Payment processed successfully' });
    }
    // Check if the amount paid is less than the monthly EMI.
    else if (amount < loanData.monthly_payment) {
        // Don't update emis_paid_on_time in this case. 
    res.json( `Please pay amount ${loanData.monthly_payment}`)
    
}
})


const ViewStatement = asyncHandler(async (req, res) => {
   
    const { customer_id, loan_id} = req.body;

    const loan = await Loan.findOne({ where: { customer_id: customer_id, loan_id: loan_id } });
    return res.status(201).json(loan.dataValues)
})

export { MakePayment,ViewStatement};