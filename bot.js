import { Telegraf } from 'telegraf';
import fetch from 'node-fetch';
import os from 'os';
import fs from 'fs';

// Ganti 'YOUR_TOKEN' dengan token bot Anda
const bot = new Telegraf('isi di sini');

// Nama file untuk menyimpan ID pengguna
const userFile = 'userid.json';

// Fungsi untuk membaca data pengguna dari file
function readUsers() {
    if (fs.existsSync(userFile)) {
        const data = fs.readFileSync(userFile);
        return JSON.parse(data);
    }
    return [];
}

// Fungsi untuk menyimpan data pengguna ke file
function saveUsers(users) {
    fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
}

// Fungsi untuk menangani perintah /start
bot.start((ctx) => {
    const userId = ctx.from.id;
    const users = readUsers();

    // Cek apakah pengguna sudah ada
    if (!users.includes(userId)) {
        // Jika belum ada, tambahkan pengguna baru
        users.push(userId);
        saveUsers(users);
        ctx.reply('Selamat datang! Anda telah terdaftar.');
    } else {
        ctx.reply('Selamat datang kembali!');
    }
});

// Fungsi untuk menangani perintah /ping
bot.command('ping', (ctx) => {
    const uptime = process.uptime(); // Waktu aktif server dalam detik
    const totalMemory = os.totalmem(); // Total RAM dalam bytes
    const freeMemory = os.freemem(); // RAM yang tersedia dalam bytes
    const usedMemory = totalMemory - freeMemory; // RAM yang digunakan

    const response = `
    🟢 **Server Status:**
    - Uptime: ${uptime.toFixed(2)} detik
    - Total RAM: ${(totalMemory / (1024 * 1024)).toFixed(2)} MB
    - RAM yang digunakan: ${(usedMemory / (1024 * 1024)).toFixed(2)} MB
    - RAM yang tersedia: ${(freeMemory / (1024 * 1024)).toFixed(2)} MB
    `;
    
    ctx.reply(response, { parse_mode: 'Markdown' });
});

// Fungsi untuk menangani perintah /createimage
bot.command('createimage', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' '); // Mengambil teks setelah perintah
    if (!text) {
        return ctx.reply('Silakan berikan teks untuk membuat gambar. Contoh: /createimage teks yang ingin dibuat');
    }

    const imageUrl = await getImageFromAPI(text);
    if (imageUrl) {
        ctx.replyWithPhoto(imageUrl);
    } else {
        ctx.reply('Terjadi kesalahan saat membuat gambar. Silakan coba lagi.');
    }
});

// Fungsi untuk mendapatkan gambar dari API
async function getImageFromAPI(text) {
    const url = `https://btch.us.kg/bingimg?text=${encodeURIComponent(text)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status && data.result.length > 0) {
            // Mengembalikan URL gambar pertama
            return data.result[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Fungsi untuk menghitung total pengguna
bot.command('totalusers', (ctx) => {
    const users = readUsers();
    ctx.reply(`Total pengguna bot ini: ${users.length}`);
});

// Fungsi untuk menangani pesan teks
bot.on('text', async (ctx) => {
    const userMessage = ctx.message.text;
    const response = await getAIResponse(userMessage);
    ctx.reply(response);
});

// Fungsi untuk mendapatkan respons dari API
async function getAIResponse(query) {
    const url = `https://loco.web.id/wp-content/uploads/api/v1/bingai.php?q=${encodeURIComponent(query)}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status) {
            const aiResponse = data.result.ai_response || 'Tidak ada jawaban yang ditemukan.';
            const searchResults = data.result.search_results;
            const webSearchResults = data.result.web_search_results;

            let additionalInfo = '';
            if (searchResults.length > 0) {
                additionalInfo = `Hasil pencarian: ${searchResults[0].title} - ${searchResults[0].url}`;
            } else if (webSearchResults.length > 0) {
                additionalInfo = `Hasil pencarian web: ${webSearchResults[0].title} - ${webSearchResults[0].url}`;
            }

            return `${aiResponse}\n${additionalInfo}`;
        } else {
            return 'Terjadi kesalahan dalam permintaan.';
        }
    } catch (error) {
        console.error('Error:', error);
        return 'Terjadi kesalahan saat menghubungi API.';
    }
};

// Mulai bot
bot.launch().then(() => {
    console.log('Bot is running...');
});



