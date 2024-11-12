   const isLoggedIn = (req, res, next) => {
    if (!req.session.user) {
      req.session.redirectTo = req.originalUrl
      req.flash('errorMessage', 'Please login first.')
      return res.redirect('/')
    } else {
      next()
    }
}

const moment = require ('moment-timezone')

const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  function formatDate(date) {
    const mDate = moment(date).tz('Asia/Jakarta')
    // const d = new Date(date);
    const day = mDate.date();
    const month = months[mDate.month()];
    const year = mDate.year();
    let hours = mDate.hours();
    let minutes = mDate.minutes();
    
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }

  

  module.exports = {
    isLoggedIn,
    formatDate
  }
 
