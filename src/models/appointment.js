const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('database.sqlite3');
const startOfDay = require('date-fns/start_of_day');
const endOfDay = require('date-fns/end_of_day');
const areRangesOverlapping = require('date-fns/are_ranges_overlapping');

const SERVICES = require('../resources/services');

const blue = "\x1b[1;36m";
const red = "\x1b[1;31m";
const rust = "\x1b[2;31m";
const reset = "\x1b[0m";

module.exports = class Appointment {
  /**
   * Makes an instance of this class with all the table's fields' values assigned.
   * @param {string} firstName Client's first name.
   * @param {string} lastName Client's last name.
   * @param {string} phoneNumber Client's phone number in the format XXX-XXX-XXXX.
   * @param {string} services Services with underscores, separated by commas.
   * @param {string} startTime ISO 8601 representation of when this appointment starts.
   */
  constructor(firstName, lastName, phoneNumber, services, startTime, endTime) {
    this.first_name   = firstName;
    this.last_name    = lastName;
    this.phone_number = phoneNumber;
    this.services     = services;
    this.start_time   = startTime;
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
    db.run(`CREATE INDEX IF NOT EXISTS start_time_idx ON appointments(start_time);`);
  }

  /**
   * Returns every single appointment without exception. Pretty much here just for testing.
   * @param {(rows) => void} callback A callback function just to use for when the query finishes.
   */
  static all(callback) {
    db.all("SELECT first_name, last_name, phone_number, services, start_time, end_time FROM appointments;", (err, rows) => {
      if (err) console.log("Error:", err);
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
      if (err) console.log("Error:", err);
      else console.log("Appointment.allAfterToday() call successful.");
      callback(rows);
    });
  }

  /**
   * Gets all the appointments but only for a specific day.
   * @param {string} date An ISO 8601-compliant time string.
   * @param {(row) => void} callback A callback function just to use for when the query finishes.
   */
  static onDate(date, callback) {
    db.all(`SELECT id, first_name, last_name, start_time, end_time
    FROM appointments
    WHERE DATE(start_time) = DATE(?);`,
    [date],
    (err, rows) => {
      if (err) {
        console.log("Error:", err);
      } else {
        console.log(`> ${blue}Appointment${reset}.${rust}onDate(${red}"${date}"${reset}${rust})
${red}SELECT ${blue}id${red}, ${blue}first_name${red}, ${blue}last_name${red}, ${blue}start_time${red}, ${blue}end_time${red} FROM ${blue}appointments ${red}WHERE DATE(${blue}start_time${red}) = DATE(${blue}"${date}"${red});
${reset}Found ${rows.length} rows.`);
      }
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

    Appointment.onDate(new Date(this.start_time), (rows) => {
      for (let i = 0; i < rows.length; i++) {
        if (areRangesOverlapping(
          new Date(this.start_time),
          new Date(this.end_time),
          rows[i].start_time,
          rows[i].end_time
        )) {
          throw "Time slot already in use.";
        }
      }
    })
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
    const services = this.services.split(/,\s*/gu).replace(/\s/gu, '_');
    this.end_time = this.start_time;

    for (let i = 0; i < SERVICES.length; i++) {
      for (let a = 0; a < services.length; a++) {
        if (services[a] === SERVICES[i].slug) {
          this.end_time = addMinutes(this.end_time, SERVICES[i].time);
        }
      }
    }
    
    this.validations();
    console.log("Validations all passed.")

    const that = this;

    db.run(
      "INSERT INTO appointments (first_name, last_name, phone_number, services, start_time, end_time) VALUES (?, ?, ?, ?, ?, ?)",
      [this.first_name, this.last_name, this.phone_number, this.services, this.start_time, this.end_time],
      function(err) {
        if (err) {
          console.log("Error:", err);
          res.status(500).send(err);
        } else {
          console.log(`> ${blue}Appointment${reset}.${rust}create()${reset}
${red}INSERT INTO appointments (${blue}first_name${red}, ${blue}last_name${red}, ${blue}start_time${red}, ${blue}end_time${red}) VALUES (${blue}"${that.first_name}"${red}, ${blue}"${that.last_name}"${red}, ${blue}"${that.phone_number}"${red}, ${blue}"${that.services}"${red}, ${blue}"${that.start_time}"${red}, ${blue}"${that.end_time}"${red});
${reset}Row successfully added.`);
          callback();
        }
      }
    );
  }
}