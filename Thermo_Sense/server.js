const express = require('express'); // Basic Library for web app
const path = require('path'); // Library for path transformation 
const http = require('http'); // Library for HTTP server
const nodemailer = require('nodemailer'); // Mail Library


const app = express();

// Create an HTTP server using express
const server = http.createServer(app);


// Define the port to open the client
const port = process.env.PORT || 3000;

// Start the server, Glitch Terminal will show this log
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});


//  Initializes parsing of JSON requests
app.use(express.json()); 

// Serve the index.html file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Sends files from the "public" directory to the client
app.use(express.static(path.join(__dirname, "public")));

// Nodemailer transporter setup sender information
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'seniordesignsebshivjohnlogan@gmail.com',
    pass: 'ymgw lmeh tcho qqhy'
  }
});


// send email function, adds message, subject, and text
const sendEmail = (to, subject, text) => {
  const mailOptions = {
    from: 'seniordesignsebshivjohnlogan@gmail.com',
    to: to,
    subject: subject,
    text: text
  };

  // Sends the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Error: ', error);
    }
  });
};


// If message from client is recieved with this command send the email
app.post('/send-email', (req, res) => {
  const { to, subject, text } = req.body;
  sendEmail(to, subject, text);
});

