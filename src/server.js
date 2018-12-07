const express = require('express');
const compareAsc = require('date-fns/compare_asc');
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
    req.body.make,
    req.body.model,
    req.body.year,
    req.body.services,
    req.body.start_time
  );

  appointment.create(res, () => {
    res.status(200).send(req.body);
  });
});

app.get('/view_all_upcoming_appointments', (req, res) => {
  Appointment.allUpcoming((rows) => {
    const appointmentsByDate = {};

    for(let i = 0; i < rows.length; i++) {
      const appointment = rows[i];
      const date = format(appointment.start_time, 'MMMM DD, YYYY');
      appointmentsByDate[date] = appointmentsByDate[date] || [];

      appointmentsByDate[date].push(appointment);
    }

    const dates = Object.keys(appointmentsByDate).sort(compareAsc);

    const tables = dates.map((date) => {
      let table = `
        <h2 class="text-white">${date}</h2>
          <table class="table table-dark table-hover">
            <thead>
              <tr>
                <th scope="col">#</th>
                <th scope="col">First Name</th>
                <th scope="col">Last Name</th>
                <th scope="col">Phone Number</th>
                <th scope="col">Vehicle</th>
                <th scope="col">Services</th>
                <th scope="col">Start Time</th>
                <th scope="col">End Time</th>
              </tr>
            </thead>
            <tbody>
      `;

      table = table + appointmentsByDate[date].map((appointment) => {
        // const offset = Number(appointment.start_time.slice(23, 26));
        // const endTime = new Date(appointment.end_time).getTime() + (offset * 60 * 60 * 1000);

        return `
              <tr>
                <th scope="row">${appointment.rowid}</th>
                <td>${appointment.first_name}</td>
                <td>${appointment.last_name}</td>
                <td>${appointment.phone_number}</td>
                <td>${appointment.year} ${appointment.make} ${appointment.model}</td>
                <td>${appointment.services.replace(/_/gu, ' ').replace(/,/gu, ', ')}</td>
                <td>${format(appointment.start_time, 'hh:mm A')}</td>
                <td>${format(appointment.end_time, 'hh:mm A')}</td>
              </tr>
        `;
      }).join('');

      return table + `
            </tbody>
          </table>
      `;
    }).join('');

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <html>
        <head>
          <title>Upcoming Appointments</title>
          <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
        </head>
        <body class="p-3 bg-dark">
          ${tables}
        </body>
      </html>
    `)
  });
});

app.get('*', (req, res) => {
  res.status(200).send("WORKS!");
});

app.listen(port, () => console.log(`Listening on port ${port}`));
