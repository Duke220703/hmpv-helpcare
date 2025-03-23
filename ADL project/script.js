'use strict';



/**
 * add event on element
 */

const addEventOnElem = function (elem, type, callback) {
  if (elem.length > 1) {
    for (let i = 0; i < elem.length; i++) {
      elem[i].addEventListener(type, callback);
    }
  } else {
    elem.addEventListener(type, callback);
  }
}



/**
 * navbar toggle
 */

const navbar = document.querySelector("[data-navbar");
const navToggler = document.querySelector("[data-nav-toggler]");
const navbarLinks = document.querySelectorAll("[data-nav-link]");

const toggleNavbar = function () {
  navbar.classList.toggle("active");
  navToggler.classList.toggle("active");
  document.body.classList.toggle("active");
}

addEventOnElem(navToggler, "click", toggleNavbar);

const closeNavbar = function () {
  navbar.classList.remove("active");
  navToggler.classList.remove("active");
  document.body.classList.remove("active");
}

addEventOnElem(navbarLinks, "click", closeNavbar);



/**
 * active header & back top btn when window scroll down to 100px
 */

const header = document.querySelector("[data-header]");
const backTopBtn = document.querySelector("[data-back-top-btn]");

const activeElemOnScroll = function () {
  if (window.scrollY > 100) {
    header.classList.add("active");
    backTopBtn.classList.add("active");
  } else {
    header.classList.remove("active");
    backTopBtn.classList.remove("active");
  }
}

addEventOnElem(window, "scroll", activeElemOnScroll);
function checkSymptoms() {
    let symptoms = document.querySelectorAll('input[name="symptom"]:checked');
    let symptomList = Array.from(symptoms).map(symptom => symptom.value);

    let resultText = "";

    if (symptomList.length === 0) {
        resultText = "You have not selected any symptoms. If you feel unwell, consult a doctor.";
    } else if (symptomList.includes("fever") && symptomList.includes("cough") && symptomList.includes("shortness_of_breath")) {
        resultText = "You have multiple key symptoms of HMPV. Please consult a doctor immediately.";
    } else if (symptomList.includes("sore_throat") || symptomList.includes("fatigue") || symptomList.includes("runny_nose")) {
        resultText = "You have mild symptoms. Monitor your condition and consult a doctor if symptoms worsen.";
    } else {
        resultText = "Your symptoms are not strongly indicative of HMPV. However, if you feel unwell, seek medical advice.";
    }

    document.getElementById("result").innerHTML = resultText;
}
function resetForm() {
    let checkboxes = document.querySelectorAll('input[name="symptom"]');
    checkboxes.forEach(checkbox => checkbox.checked = false);
    
    // Clear the result text
    document.getElementById("result").innerHTML = "";
}

/* payment */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Razorpay = require("razorpay");
const paypal = require("paypal-rest-sdk");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

// 📌 Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

// 📌 Payment Schema
const Payment = mongoose.model("Payment", new mongoose.Schema({
    name: String,
    email: String,
    amount: Number,
    paymentMethod: String,
    transactionId: String,
    date: { type: Date, default: Date.now }
}));

// 📌 PayPal Configuration
paypal.configure({
    mode: "sandbox", // Change to "live" for production
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_SECRET
});

// 📌 Razorpay Configuration
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET
});

// 📌 Stripe Payment Route
app.post("/pay/stripe", async (req, res) => {
    try {
        const { name, email, amount } = req.body;
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, // Convert to cents
            currency: "usd",
            receipt_email: email,
        });

        // Save to database
        const payment = new Payment({ name, email, amount, paymentMethod: "Stripe", transactionId: paymentIntent.id });
        await payment.save();

        generateReceipt(name, email, amount, "Stripe", paymentIntent.id);
        res.json({ success: true, clientSecret: paymentIntent.client_secret });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 📌 PayPal Payment Route
app.post("/pay/paypal", (req, res) => {
    const { name, email, amount } = req.body;

    const create_payment_json = {
        intent: "sale",
        payer: { payment_method: "paypal" },
        transactions: [{ amount: { currency: "USD", total: amount.toString() }, description: "Donation Payment" }],
        redirect_urls: { return_url: "http://localhost:5000/success", cancel_url: "http://localhost:5000/cancel" }
    };

    paypal.payment.create(create_payment_json, async (error, payment) => {
        if (error) return res.status(500).json({ success: false, message: error.message });

        // Save to database
        const transactionId = payment.id;
        const newPayment = new Payment({ name, email, amount, paymentMethod: "PayPal", transactionId });
        await newPayment.save();

        generateReceipt(name, email, amount, "PayPal", transactionId);
        res.json({ success: true, paymentUrl: payment.links[1].href });
    });
});

// 📌 Razorpay Payment Route
app.post("/pay/razorpay", async (req, res) => {
    try {
        const { name, email, amount } = req.body;
        const payment = await razorpay.orders.create({
            amount: amount * 100, // Convert to paisa
            currency: "INR",
            receipt: `rec_${Date.now()}`
        });

        const newPayment = new Payment({ name, email, amount, paymentMethod: "Razorpay", transactionId: payment.id });
        await newPayment.save();

        generateReceipt(name, email, amount, "Razorpay", payment.id);
        res.json({ success: true, orderId: payment.id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// 📌 Generate PDF Receipt
function generateReceipt(name, email, amount, method, transactionId) {
    const doc = new PDFDocument();
    const filePath = `receipts/${transactionId}.pdf`;

    doc.pipe(fs.createWriteStream(filePath));
    doc.fontSize(20).text("Payment Receipt", { align: "center" });
    doc.fontSize(14).text(`Name: ${name}`);
    doc.text(`Email: ${email}`);
    doc.text(`Amount: $${amount}`);
    doc.text(`Payment Method: ${method}`);
    doc.text(`Transaction ID: ${transactionId}`);
    doc.end();

    sendReceipt(email, filePath);
}

// 📌 Send Receipt via Email
function sendReceipt(email, filePath) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Payment Receipt",
        text: "Thank you for your payment. Please find the receipt attached.",
        attachments: [{ filename: "receipt.pdf", path: filePath }]
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
        else console.log("Email sent: " + info.response);
    });
}

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
