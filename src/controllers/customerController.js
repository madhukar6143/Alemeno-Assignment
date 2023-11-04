import asyncHandler from 'express-async-handler'
import Customer from '../models/customer.js'
import Loan from '../models/loan.js';
import { calculateEMI } from '../utils/emi.js'

const Register = asyncHandler(async (req, res) => {
    const { first_name, last_name, age, monthly_income, phone_number } = req.body;
    const approved_limit = Math.round(36 * monthly_income / 100000) * 100000; // Round to the nearest lakh
    let input = {
        customer_id:phone_number,
        first_name: first_name,
        last_name: last_name,
        age: age,
        phone_number: phone_number,
        monthly_salary: monthly_income,
        approved_limit: approved_limit,
        current_debt: 0,
        credit_score: 100
    }
    const customerCheck = await Customer.findOne({ where: { phone_number: phone_number } })
    if (customerCheck) {
      return res.status(409).send({message:" same mobile enumber already exits"})
    }
    await Customer.create(input);
    return res.status(201).send("new user creatd")

})

// Define a function to check eligibility
const checkEligibile= async (customer_id, tenure, loan_amount, interest_rate) => {
    // Retrieve customer information
    const customer= await Customer.findOne({ where: { customer_id: customer_id } })
    if (!customer) {
        return { eligible: false, message: "Customer not found" };
    }
    if(customer.approved_limit<loan_amount)
    {
        return { eligible: false, message: "Loan not approved cuz loanamount is more than approved limit" };
    }
    if (interest_rate <= 8) {
        interest_rate = 8;
    }
    
    const creditScore = customer.credit_score;
    if (creditScore > 50) {
        // Eligible for a loan with the given interest rate
        const monthly_installment = calculateEMI(loan_amount, interest_rate, tenure);
        return { eligible: true, interest_rate, corrected_interest_rate: interest_rate, tenure, monthly_installment };
    } else if (creditScore > 30) {
        // Eligible for a loan with interest rate > 12%
        const monthly_installment = calculateEMI(loan_amount, 12, tenure);
        return { eligible: true, interest_rate: 12, corrected_interest_rate: 12, tenure, monthly_installment };
    } else if (creditScore > 10) {
        // Eligible for a loan with interest rate > 16%
        const monthly_installment = calculateEMI(loan_amount, 16, tenure);
        return { eligible: true, interest_rate: 16, corrected_interest_rate: 16, tenure, monthly_installment };
    } else {
        // Not eligible for a loan
        return { eligible: false, message: "Loan not approved" };
    }
};


const CheckEligibility = asyncHandler(async (req, res) => {
    const { customer_id, tenure, loan_amount, interest_rate } = req.body;
    
    const eligibilityInfo = await checkEligibile(customer_id, tenure, loan_amount, interest_rate);
    
    res.json(eligibilityInfo);

});



const CreateLoan = asyncHandler(async (req, res) => {

    const { customer_id, tenure, loan_amount, interest_rate } = req.body;
    
    const eligibilityInfo = await checkEligibile(customer_id, tenure, loan_amount, interest_rate);
    
    if (eligibilityInfo.eligible) {
        // Create a new loan based on eligibility information
        // Implement your loan creation logic here

        const startDate = new Date(); // Get today's date
const endDate = new Date(startDate); // Clone the start date
endDate.setMonth(startDate.getMonth() + eligibilityInfo.tenure);
        // Example: create a new loan
        const newLoan = await Loan.create({
            customer_id: customer_id,
            loan_id:1234555,
            loan_amount:loan_amount,
            interest_rate: eligibilityInfo.interest_rate,
            emis_paid_on_time:0,
            tenure: eligibilityInfo.tenure,
            monthly_payment:eligibilityInfo.monthly_installment,
            start_date:startDate ,
            end_date:endDate,
            calculated_emi:eligibilityInfo.monthly_installment,
        });
        
        res.json({ message: "New loan created", loan: newLoan });
    } else {
        res.json(eligibilityInfo);
    }
})

const ViewLoan = asyncHandler(async (req, res) => {
    const customer_id= req.params.customer_id;
    const LoanData = await Loan.findAll({ where: { customer_id:customer_id } })
    return res.status(200).json({LoanData})
})

export { Register, CheckEligibility, CreateLoan, ViewLoan };