/* ==========================================================================
   IPWIJARUN2026 TICKETING SYSTEM - BACKEND NODE.JS SERVER
   ========================================================================== */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files of frontend from the current directory
app.use(express.static(__dirname));

// Utility to read database helper
async function readDatabase() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data || '[]');
    } catch (error) {
        // If file doesn't exist, create it with empty array
        if (error.code === 'ENOENT') {
            await fs.writeFile(DB_FILE, '[]');
            return [];
        }
        console.error("Error reading database: ", error);
        return [];
    }
}

// Utility to write database helper
async function writeDatabase(data) {
    try {
        await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error("Error writing to database: ", error);
        throw error;
    }
}

// Categories definitions
const CATEGORY_NAMES = {
    "5K": "5K Fun Run",
    "10K": "10K Power Run",
    "21K": "21K Half Marathon"
};

const CATEGORY_PRICES = {
    "5K": 150000,
    "10K": 250000,
    "21K": 400000
};

/* ==========================================================================
   REST API ENDPOINTS
   ========================================================================== */

// 1. GET ALL TICKETS (Includes Search & Category Filters)
app.get('/api/tickets', async (req, res) => {
    try {
        const tickets = await readDatabase();
        const search = (req.query.search || '').toLowerCase().trim();
        const category = (req.query.category || 'all').toUpperCase().trim();

        let filtered = tickets;

        // Apply Category Filter
        if (category !== 'ALL') {
            filtered = filtered.filter(t => t.category === category);
        }

        // Apply Search Filter
        if (search) {
            filtered = filtered.filter(t => 
                t.runnerName.toLowerCase().includes(search) ||
                t.ticketId.toLowerCase().includes(search) ||
                (t.bibNumber && t.bibNumber.toLowerCase().includes(search)) ||
                t.email.toLowerCase().includes(search)
            );
        }

        res.json(filtered);
    } catch (error) {
        res.status(500).json({ error: "Gagal memproses permintaan." });
    }
});

// 2. GET SINGLE TICKET BY ID
app.get('/api/tickets/:id', async (req, res) => {
    try {
        const tickets = await readDatabase();
        const ticket = tickets.find(t => t.ticketId === req.params.id);

        if (!ticket) {
            return res.status(404).json({ error: "Tiket tidak ditemukan." });
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data tiket." });
    }
});

// 3. REGISTER NEW PARTICIPANT (POST)
app.post('/api/tickets', async (req, res) => {
    try {
        const {
            category,
            runnerName,
            email,
            phone,
            jerseySize,
            emergencyContact,
            medalEngraving,
            shippingAddress
        } = req.body;

        // Basic Validations
        if (!category || !runnerName || !email || !phone || !jerseySize || !emergencyContact) {
            return res.status(400).json({ error: "Data registrasi tidak lengkap." });
        }

        const tickets = await readDatabase();

        // 1. Generate unique Ticket ID: T26-[cat]-[5-digits]
        let isUniqueId = false;
        let ticketId = "";
        while (!isUniqueId) {
            const randDigits = Math.floor(10000 + Math.random() * 90000);
            ticketId = `T26-${category.replace('K', '')}-${randDigits}`;
            if (!tickets.some(t => t.ticketId === ticketId)) {
                isUniqueId = true;
            }
        }

        // 2. Generate unique BIB Number: R26-[cat]-[4-digits]
        let isUniqueBib = false;
        let bibNumber = "";
        while (!isUniqueBib) {
            const randBibDigits = Math.floor(1000 + Math.random() * 9000);
            bibNumber = `BIB: R26-${category.replace('K', '')}-${randBibDigits}`;
            if (!tickets.some(t => t.bibNumber === bibNumber)) {
                isUniqueBib = true;
            }
        }

        // 3. Calculate dynamic total price
        const basePrice = CATEGORY_PRICES[category] || 0;
        const addOnMedalCost = medalEngraving && medalEngraving !== '-' ? 30000 : 0;
        const addOnShippingCost = shippingAddress && shippingAddress !== '-' ? 25000 : 0;
        const totalPrice = basePrice + addOnMedalCost + addOnShippingCost;

        // 4. Create new ticket record
        const newTicket = {
            ticketId,
            bibNumber,
            category,
            runnerName: runnerName.trim(),
            email: email.trim(),
            phone: phone.trim(),
            jerseySize,
            emergencyContact: emergencyContact.trim(),
            medalEngraving: medalEngraving || '-',
            shippingAddress: shippingAddress || '-',
            pricePaid: totalPrice,
            purchaseDate: new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }),
            createdAt: new Date().toISOString()
        };

        tickets.unshift(newTicket);
        await writeDatabase(tickets);


        res.status(201).json(newTicket);
    } catch (error) {
        console.error("Error creating registration: ", error);
        res.status(500).json({ error: "Gagal melakukan registrasi." });
    }
});

// 4. DELETE REGISTERED PARTICIPANT (DELETE)
app.delete('/api/tickets/:id', async (req, res) => {
    try {
        const tickets = await readDatabase();
        const initialLength = tickets.length;
        const filtered = tickets.filter(t => t.ticketId !== req.params.id);

        if (filtered.length === initialLength) {
            return res.status(404).json({ error: "Peserta tidak ditemukan." });
        }

        await writeDatabase(filtered);
        res.json({ success: true, message: `Pendaftaran ${req.params.id} berhasil dibatalkan.` });
    } catch (error) {
        res.status(500).json({ error: "Gagal menghapus data peserta." });
    }
});

// 5. GET DATABASE ANALYTICS STATS
app.get('/api/stats', async (req, res) => {
    try {
        const tickets = await readDatabase();

        // 1. Total Revenue
        const totalRevenue = tickets.reduce((sum, t) => sum + (t.pricePaid || 0), 0);

        // 2. Count by category
        const categoryCounts = { "5K": 0, "10K": 0, "21K": 0 };
        // 3. Count by jersey size
        const jerseyCounts = { "XS": 0, "S": 0, "M": 0, "L": 0, "XL": 0, "XXL": 0 };

        tickets.forEach(t => {
            if (categoryCounts[t.category] !== undefined) {
                categoryCounts[t.category]++;
            }
            if (jerseyCounts[t.jerseySize] !== undefined) {
                jerseyCounts[t.jerseySize]++;
            }
        });

        // 4. Quota remaining logic simulation
        const totalSlots = { "5K": 1000, "10K": 800, "21K": 500 };
        const slotsLeft = {
            "5K": Math.max(0, totalSlots["5K"] - categoryCounts["5K"]),
            "10K": Math.max(0, totalSlots["10K"] - categoryCounts["10K"]),
            "21K": Math.max(0, totalSlots["21K"] - categoryCounts["21K"])
        };

        res.json({
            totalRegistrations: tickets.length,
            totalRevenue,
            categoryCounts,
            jerseyCounts,
            slotsLeft,
            recentTickets: tickets.slice(0, 5) // Recent 5 registrations
        });
    } catch (error) {
        res.status(500).json({ error: "Gagal memproses data statistik." });
    }
});

// Serve admin panel
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Serve frontend routing fallback
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(`  IPWIJARUN2026 SERVER DATABASE AKTIF!                          `);
    console.log(`  Membuka halaman web app di: http://localhost:${PORT}           `);
    console.log(`  Database disimpan lokal di: ${DB_FILE}                         `);
    console.log(`================================================================`);
});
