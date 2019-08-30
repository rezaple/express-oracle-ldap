const { baseUrlImage } = require('../config/web-server.js');

function transformList(data){
    return {
        id: parseInt(data.ID,10),
        nama: data.NAMA || "",
        path_image: data.PATH_IMAGE? baseUrlImage+data.PATH_IMAGE:"",
    }
}

module.exports = {
    transformList,
}