import asyncHandler from 'express-async-handler'

import Customer from '../models/customer.js'
import { binarySearchAll } from '../utils/binarySearch.js';
import { calculateCreditScore } from '../utils/creditScore.js'
import xlsx from 'xlsx'
import { calculateEMI } from '../utils/emi.js';
import { InsertCustomerData ,InsertLoanData } from '../utils/insertcustomerdata.js';

// Read XLSX files

const InsertCustomer = asyncHandler(async (req, res) => {
    const customerWorkbook = xlsx.readFile('customer_data.xlsx');
    const customerData = xlsx.utils.sheet_to_json(customerWorkbook.Sheets[customerWorkbook.SheetNames[0]]);
    const loanWorkbook = xlsx.readFile('loan_data.xlsx');
    const loanDataUnparsed = xlsx.utils.sheet_to_json(loanWorkbook.Sheets[loanWorkbook.SheetNames[0]]);
    const loanData = xlsx.utils.sheet_to_json(loanWorkbook.Sheets[loanWorkbook.SheetNames[0]], {
        raw: false,
        cellDates: true, // Tell xlsx to treat date cells as dates
        dateNF: 'yyyy-mm-dd',
    });
    const combinedLoanData = loanDataUnparsed.map((loan, index) => {
        const { start_date, end_date } = loanData[index];
        return {
            ...loan,
            start_date,
            end_date,
        };
    });
    combinedLoanData.sort((a, b) => a.customer_id - b.customer_id);

    customerData.forEach(async (customer) => {
     
      
        await InsertCustomerData(customer)

        const customerLoans = binarySearchAll(combinedLoanData, customer.customer_id);
        let creditScore = 0;
        let totalLoanVolume = 0;
        let totalDebt = 0;
        /*
       
*/
        // Apply points for past loans (adjust these points as needed)
        let totalLoans = customerLoans.length;
        if (totalLoans === 0) {
            creditScore += 10;
        }
        else if (totalLoans === 1) {
            creditScore += 8;
        }
        else if (totalLoans === 2) {
            creditScore += totalLoans * 6;
        }
        else if (totalLoans === 3) {
            creditScore += totalLoans * 4;
        }
        customerLoans.map(async (loan) => {
            const emi = calculateEMI(loan.loan_amount, loan.interest_rate, loan.tenure);
            creditScore = creditScore + calculateCreditScore(loan, emi);
            totalLoanVolume = totalLoanVolume + loan.loan_amount;
            let count = loan['EMIs paid on Time']
            totalDebt += emi * loan.tenure - (count * emi)
         await InsertLoanData(loan,emi,customer.phone_number)
        })
        
        
        let totalCreditScore
        if (totalLoans >= 1)
            totalCreditScore = Math.round(creditScore / totalLoans)
        else
            totalCreditScore = 100
      
        const customerUpdate = await Customer.findOne({ where: { phone_number: customer.phone_number } })
        if (customerUpdate) {
            // Update the desired values
            if(customerUpdate.approved_limit < totalDebt)
            totalCreditScore=0;
            customerUpdate.credit_score = totalCreditScore;
            customerUpdate.current_debt = totalDebt;
            // Save the changes to the database
            await customerUpdate.save();
        }
    })

    return res.send("custmer inserted successfully")
})




export { InsertCustomer };


