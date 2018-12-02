const express = require('express');
const format = require('date-fns/format');

const app = express();
const port = process.env.PORT || 5000;

const bodyParser = require('body-parser');
const Appointment = require('./models/appointment');

app.use(bodyParser.urlencoded({ extended: true }));
Appointment.make_db();

// app.get('/display/:year/:month/:day', (req, res) => {});

app.get('/appointment/:date', (req, res) => {
  Appointment.onDate(req.params["date"], (rows) => {
    res.status(200).send(rows);
  });
});

app.post('/appointment', (req, res) => {
  console.log("Received [POST] /appointment");
  console.log("Params:", req.body);

  let appointment = new Appointment(
    req.body.first_name,
    req.body.last_name,
    req.body.phone_number,
    req.body.services,
    req.body.start_time
  );

  appointment.create(res, () => {
    res.status(200).send(req.body);
  });
});

app.get('/view_all_appointments_today', (req, res) => {
  Appointment.onDateAllData(new Date().toISOString(), (rows) => {
    const tableRows = rows.map((row) => {
      return `
        <tr>
          <th scope="row">${row.rowid}</th>
          <td>${row.first_name}</td>
          <td>${row.last_name}</td>
          <td>${row.phone_number}</td>
          <td>${row.services.replace(/_/gu, ' ')}</td>
          <td>${format(row.start_time, 'hh:mm A')}</td>
          <td>${format(row.end_time, 'hh:mm A')}
        </tr>
      `;
    });

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <title>Today's Appointments</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
        </head>
        <body class="p-3 bg-dark">
          <h2 class="text-white">${format(new Date(), 'MMMM DD, YYYY')}</h2>
          <table class="table table-dark table-hover">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">First Name</th>
                <th scope="col">Last Name</th>
                <th scope="col">Phone Number</th>
                <th scope="col">Services</th>
                <th scope="col">Start Time</th>
                <th scope="col">End Time</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `)
  });
});

app.get('*', (req, res) => {
  res.status(200).send("WORKS!");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
