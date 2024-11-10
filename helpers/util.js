   const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        next()
    } else {
        res.redirect('/')
    }
}

const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  function formatDate(date) {
    const d = new Date(date);
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    let hours = d.getHours();
    let minutes = d.getMinutes();
    
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${day} ${month} ${year} ${hours}:${minutes}`;
  }
  

  module.exports = {
    isLoggedIn,
    formatDate
  }
 
