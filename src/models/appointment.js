const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite3');

module.exports = class Appointment {
  /**
   * Makes an instance of this class with all the table's fields' values assigned.
   * @param {string} firstName Client's first name.
   * @param {string} lastName Client's last name.
   * @param {string} phoneNumber Client's phone number in the format XXX-XXX-XXXX.
   * @param {string} services Services with underscores, separated by commas.
   * @param {string} startTime ISO 8601 representation of when this appointment starts.
   * @param {string} endTime ISO 8601 representation of when this appointment ends.
   */
  constructor(firstName, lastName, phoneNumber, services, startTime, endTime) {
    this.first_name   = firstName;
    this.last_name    = lastName;
    this.phone_number = phoneNumber;
    this.services     = services;
    this.start_time   = startTime;
    this.end_time     = endTime;
  }

  /**
   * Just a static function to create the table for this model.
   */
  static make_db() {
    db.run(`CREATE TABLE IF NOT EXISTS appointments (
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone_number VARCHAR(20) NOT NULL,
      services TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    )`);
  }

  /**
   * Returns every single appointment without exception. Pretty much here just for testing.
   * @param {(rows) => void} callback A callback function just to use for when the query finishes.
   */
  static all(callback) {
    db.all("SELECT first_name, last_name, phone_number, services, start_time, end_time FROM appointments;", (err, rows) => {
      if(err) console.log("Error:", err);
      else console.log("Appointment.all() call successful.");
      callback(rows);
    });
  }

  /**
   * Returns every appointment after the current day.
   * @param {(rows) => void} callback A callback function just to use for when the query finishes.
   */
  static allAfterToday(callback) {
    db.all(`SELECT first_name, last_name, phone_number, services, start_time, end_time
    FROM appointments
    WHERE start_time >= date('now', 'localtime', '+1 day');`,
    (err, rows) => {
      if(err) console.log("Error:", err);
      else console.log("Appointment.allAfterToday() call successful.");
      callback(rows);
    });
  }

  /**
   * Validates whether each field is populated and valid or not.
   */
  validations() {
    this.validates_existence_of("first_name");
    this.validates_existence_of("last_name");
    this.validates_existence_of("phone_number");
    this.validates_existence_of("services");
    this.validates_existence_of("start_time");
    this.validates_existence_of("end_time");
  }

  /**
   * Checks if the property exists on this instance of Appointment and whether it's blank.
   * @param {string | undefined} prop The name of the prop that we're checking the existence of.
   */
  validates_existence_of(prop) {
    if(this[prop] === undefined || typeof this[prop] === "string" && this[prop] === "") {
      throw prop + " cannot be blank.";
    }
  }

  /**
   * Creates an entry in the database for a new appointment.
   * @param {Response} res Express HTTP response object.
   * @param {string} callback A callback that's basically just to say that stuff happened correctly.
   */
  create(res, callback) {
    this.validations();
    console.log("Validations all passed.")

    db.run(
      "INSERT INTO appointments (first_name, last_name, phone_number, services, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
      [this.first_name, this.last_name, this.phone_number, this.services, this.start_time, this.end_time],
      function(err) {
        if(err) {
          console.log("Error:", err);
          res.status(500).send(err);
        } else {
          console.log(this.changes + " rows were added.");
          callback(this.changes);
        }
      }
    );
  }
}