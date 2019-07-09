function transformList(lahan){
    return {
        IDAREAL: parseInt(lahan.IDAREAL),
        COOR_X: lahan.COOR_X,
        COOR_Y: lahan.COOR_Y,
        NAMA_LAHAN: lahan.NAMA_LAHAN,
        ALAMAT: lahan.ALAMAT,
        LUAS_LAHAN: lahan.LUAS_LAHAN?lahan.LUAS_LAHAN:0,
        JUMLAH_BANGUNAN: lahan.JUMLAH_BANGUNAN?lahan.JUMLAH_BANGUNAN:0,
        GUNA_LAHAN: lahan.GUNA_LAHAN?lahan.GUNA_LAHAN:"",
        SKHAK: lahan.SKHAK?lahan.SKHAK:"",
        TANGGAL_AKHIR: lahan.TANGGAL_AKHIR?lahan.TANGGAL_AKHIR:"",
        NAMA_KLASIFIKASI: lahan.NAMA_KLASIFIKASI_ALIAS?lahan.NAMA_KLASIFIKASI_ALIAS:"",
        STATUS_SERTIFIKAT: lahan.STATUS_KEP?lahan.STATUS_KEP:"",
        //DESKRIPSI: lahan.DESKRIPSI?lahan.DESKRIPSI:"",
        PATH_LAHAN_IMAGE: lahan.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+lahan.PATH_LAHAN_IMAGE:"",
        STATUS_TANAH: lahan.STATUS_HGB?lahan.STATUS_HGB:"",
        STATUS_LAHAN: lahan.SALEABLE_AREA===0?'Lahan Terisi':'Lahan Kosong',
        RN: lahan.RN,
        DISTANCE: lahan.DISTANCE?parseFloat(lahan.DISTANCE.toFixed(2)):0
    }
}

function transformListGedung(data){
    return {
        IDGEDUNG: parseInt(data.IDGEDUNG,10),
        COOR_X: data.COOR_X?data.COOR_X:"",
        COOR_Y: data.COOR_Y?data.COOR_Y:"",
        NAMA_GEDUNG: data.NAMA_GEDUNG,
        ALAMAT: data.ALAMAT?data.ALAMAT:"",
        LUAS_BANGUNAN: data.LUAS_BANGUNAN? parseInt(data.LUAS_BANGUNAN,10):0,
        JUMLAH_LANTAI: data.JUMLAH_LANTAI? parseInt(data.JUMLAH_LANTAI,10):0,
        SALEABLE_AREA: data.SALEABLE_AREA? parseInt(data.SALEABLE_AREA,10):0,
        NAMA_KEGIATAN: data.NAMA_KEGIATAN? data.NAMA_KEGIATAN:"",
        PATH_GEDUNG_IMAGE: data.PATH_GEDUNG_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+data.PATH_GEDUNG_IMAGE:""
    }
}

function transformKJPPLahan(kjpp){
    return {
        ID: parseInt(kjpp.ID),
        NAMA: kjpp.NAMA?kjpp.NAMA:"",
        LUAS: kjpp.LUAS?parseInt(kjpp.LUAS,10):0,
        TANGGAL: kjpp.TANGGAL?kjpp.TANGGAL:"",
        HARGA: kjpp.HARGA?parseInt(kjpp.HARGA,10):0,
    }
}

function transformAttSengketaLahan(data){
    return {
        NAMA_DOKUMEN: data.NAMA_DOKUMEN?data.NAMA_DOKUMEN:"",
        DESKRIPSI: data.DESKRIPSI?data.DESKRIPSI:"",
        FILE_PATH: data.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+data.FILE_PATH:""
    }
}

function transformNKALahan(nka){
    return {
        ID: parseInt(nka.ID),
        NOMOR_KARTU_ASET: nka.NOMOR_KARTU_ASET?nka.NOMOR_KARTU_ASET:"",
        NOMOR_ANAK_KARTU: nka.NOMOR_ANAK_KARTU?nka.NOMOR_ANAK_KARTU:"",
        NILAI_HARGA_PEROLEHAN: nka.NILAI_HARGA_PEROLEHAN?parseInt(nka.NILAI_HARGA_PEROLEHAN,10):0,
        AKUMULASI_PENYUSUTAN: nka.AKUMULASI_PENYUSUTAN?parseInt(nka.AKUMULASI_PENYUSUTAN,10):0,
        BEBAN_PENYUSUTAN: nka.BEBAN_PENYUSUTAN?parseInt(nka.BEBAN_PENYUSUTAN,10):0,
        DESKRIPSI: nka.DESKRIPSI?nka.DESKRIPSI:"",
        TANGGAL:nka.TANGGAL?nka.TANGGAL:""
    }
}

function transformSengketaAset(aset){
    return {
        ID: parseInt(aset.ID),
        TANGGAL:aset.TANGGAL?aset.TANGGAL:"",
        STATUS:aset.STATUS?aset.STATUS:"",
        PERMASALAHAN_DAN_KATEGORI:aset.PERMASALAHAN_DAN_KATEGORI?aset.PERMASALAHAN_DAN_KATEGORI:"",
        RINGKASAN_PERMASALAHAN:aset.RINGKASAN_PERMASALAHAN?aset.RINGKASAN_PERMASALAHAN:"",
        PROSES_PENANGANAN:aset.PROSES_PENANGANAN?aset.PROSES_PENANGANAN:"",
        ISU_PENTING:aset.ISU_PENTING?aset.ISU_PENTING:"",
        ATTACHMENT:aset.attachment
    }
}

function transformPBBLahan(pbb){
    return {
        ID: parseInt(pbb.ID),
        NOP: pbb.NOP?pbb.NOP:"",
        TAHUN: pbb.TAHUN?pbb.TAHUN:"",
        LUAS_LAHAN_BUMI: pbb.LUAS_LAHAN_BUMI?parseInt(pbb.LUAS_LAHAN_BUMI,10):0,
        NJOP_BUMI: pbb.NJOP_BUMI?parseInt(pbb.NJOP_BUMI,10):0,
        KELAS_BUMI: pbb.KELAS_BUMI?pbb.KELAS_BUMI:"",
        TOTAL_NJOP_BUMI: pbb.TOTAL_NJOP_BUMI?parseInt(pbb.TOTAL_NJOP_BUMI,10):0,
        LUAS_BANGUNAN: pbb.LUAS_BANGUNAN?parseInt(pbb.LUAS_BANGUNAN,10):0,
        NJOP_BANGUNAN: pbb.NJOP_BANGUNAN?parseInt(pbb.NJOP_BANGUNAN,10):0,
        KELAS_BANGUNAN: pbb.KELAS_BANGUNAN?pbb.KELAS_BANGUNAN:"",
        TOTAL_NJOP_BANGUNAN: pbb.TOTAL_NJOP_BANGUNAN?parseInt(pbb.TOTAL_NJOP_BANGUNAN,10):0,
        TOTAL_PBB_DIBAYAR: pbb.TOTAL_PBB_DIBAYAR?parseInt(pbb.TOTAL_PBB_DIBAYAR,10):0
    }
}

function transformSertifikatLahan(sert){
    return {
        ID: parseInt(sert.ID),
        NO_SERTIPIKAT: sert.NO_SERTIPIKAT? sert.NO_SERTIPIKAT:"",
        ATAS_NAMA: sert.ATAS_NAMA?sert.ATAS_NAMA:"",
        SKHAK: sert.SKHAK?sert.SKHAK:"",
        LUAS: sert.LUAS?sert.LUAS:0,
        TANGGAL_AKHIR: sert.TANGGAL_AKHIR?sert.TANGGAL_AKHIR:"",
        LOKASI_ASET: sert.LOKASI_ASET?sert.LOKASI_ASET:"",
        ATTACHMENT:sert.attachment
    }
}

function transformAttSertifikatLahan(att){
    return {
        ID: parseInt(att.ID),
        NAMA_DOKUMEN: att.NAMA_DOKUMEN?att.NAMA_DOKUMEN:"",
        DESKRIPSI: att.DESKRIPSI?att.DESKRIPSI:"",
        FILE_NAME: att.FILE_NAME?att.FILE_NAME:"",
        FILE_TYPE: att.FILE_TYPE?att.FILE_TYPE:"",
        FILE_PATH: att.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+att.FILE_PATH:"",
        FILE_SIZE: att.FILE_SIZE?att.FILE_SIZE:0
    }
}

function transformImageLahan(img){
    return {
        ID: parseInt(img.ID),
        FILE_NAME: img.FILE_NAME?img.FILE_NAME:"",
        FILE_TITLE: img.FILE_TITLE?img.FILE_TITLE:"",
        FILE_PATH: img.FILE_PATH? 'http://mrra.telkom.co.id/gis/assets'+img.FILE_PATH:"",
        FILE_SIZE: img.FILE_SIZE?img.FILE_SIZE:0,
    }
}

function transformLahanMaster(lahan){
    return {
    IDAREAL: parseInt(lahan.IDAREAL),
    NAMA_LAHAN: lahan.NAMA_LAHAN,
    ALAMAT: lahan.ALAMAT,
    COOR_X: lahan.COOR_X?lahan.COOR_X:0,
    COOR_Y: lahan.COOR_Y?lahan.COOR_Y:0,
    LUAS_LAHAN: lahan.LUAS_LAHAN?lahan.LUAS_LAHAN:0,
    ID_PROPINSI:lahan.ID_PROPINSI?parseInt(lahan.ID_PROPINSI,10):0,
    PROPINSI:lahan.PROPINSI?lahan.PROPINSI:"",
    ID_KOTA:lahan.ID_KOTA?parseInt(lahan.ID_KOTA,10):0,
    KOTA:lahan.KOTA?lahan.KOTA:"",
    ID_KECAMATAN:lahan.ID_KECAMATAN?parseInt(lahan.ID_KECAMATAN,10):0,
    KECAMATAN:lahan.KECAMATAN?lahan.KECAMATAN:"",
    ID_DESA:lahan.ID_DESA?parseInt(lahan.ID_DESA,10):0,
    DESA:lahan.DESA?lahan.DESA:"",
    ID_TREG:lahan.ID_TREG?parseInt(lahan.ID_TREG,10):0,
    TREG:lahan.TREG?lahan.TREG:"",
    ID_WITEL:lahan.ID_WITEL?parseInt(lahan.ID_WITEL,10):0,
    WITEL:lahan.WITEL?lahan.WITEL:"",
    NAMA_KLASIFIKASI: lahan.NAMA_KLASIFIKASI_ALIAS?lahan.NAMA_KLASIFIKASI_ALIAS:"",
    NAMA_STATUS_KEPEMILIKAN: lahan.NAMA_STATUS_KEPEMILIKAN?lahan.NAMA_STATUS_KEPEMILIKAN:"",
    PATH_LAHAN_IMAGE: lahan.PATH_LAHAN_IMAGE? 'http://mrra.telkom.co.id/gis/assets'+lahan.PATH_LAHAN_IMAGE:"",
    }
}
  
  
module.exports = {
    transformList,
    transformListGedung,
    transformKJPPLahan,
    transformAttSengketaLahan,
    transformNKALahan,
    transformSengketaAset,
    transformPBBLahan,
    transformSertifikatLahan,
    transformAttSertifikatLahan,
    transformImageLahan,
    transformLahanMaster
}