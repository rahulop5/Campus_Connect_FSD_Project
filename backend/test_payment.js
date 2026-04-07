import Razorpay from 'razorpay';
import dotenv from 'dotenv';
dotenv.config();

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function run() {
  try {
    const userId = "5f9d2e1a8bb23a0017fda2c1"; 
    const receipt = `receipt_${userId}_${Date.now()}`;
    console.log("receipt length:", receipt.length); 

    const options = {
        amount: 9900,
        currency: "INR",
        receipt: receipt,
    };
    
    const order = await instance.orders.create(options);
    console.log("Success:", order.id);
  } catch (err) {
    console.error("Error creating order:", err.error || err);
  }
}

run();
