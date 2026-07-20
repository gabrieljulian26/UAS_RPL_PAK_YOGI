/* ==========================================================================
   IPWIJARUN2026 TICKETING SYSTEM - ADMIN PORTAL JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // App State
    let adminTicketsList = []; // Holds list of active participants
    const CATEGORY_NAMES = {
        "5K": "5K Fun Run",
        "10K": "10K Power Run",
        "21K": "21K Half Marathon"
    };

    // Automatic Database Detection (Full-Stack Fallback to LocalStorage)
    // Runs in backend mode when served by the Express server (port 3000/3005) or via sharing tunnels like Pinggy.
    // If run via VS Code Live Server (ports 5500-5505) or file://, it falls back to LocalStorage.
    const useBackend = window.location.protocol.startsWith("http") && 
                       !["5500", "5501", "5502", "5503", "5504", "5505"].includes(window.location.port);

    if (!useBackend) {
        console.warn("IPWIJARUN2026 Admin: Berjalan offline/Live Server. Sinkronisasi via LocalStorage.");
    }

    // DOM Elements
    const adminTableBody = document.getElementById("adminTableBody");
    const adminEmptyState = document.getElementById("adminEmptyState");
    const adminSearchInput = document.getElementById("adminSearchInput");
    const btnExportCsv = document.getElementById("btnExportCsv");
    
    const adminStatTotalRunners = document.getElementById("adminStatTotalRunners");
    const adminStatTotalRevenue = document.getElementById("adminStatTotalRevenue");
    const adminStat21kCount = document.getElementById("adminStat21kCount");
    const adminStat10kCount = document.getElementById("adminStat10kCount");

    /* ==========================================================================
       1. DATA SYNCHRONIZATION
       ========================================================================== */

    // Fetch and calculate statistics
    async function fetchAdminStats() {
        if (!useBackend) {
            // Local calculation for offline mode (reading from LocalStorage)
            const localTickets = JSON.parse(localStorage.getItem("ipwijarun2026_tickets")) || [];
            const totalRevenue = localTickets.reduce((sum, t) => sum + (t.pricePaid || 0), 0);
            
            const counts = { "5K": 0, "10K": 0, "21K": 0 };
            localTickets.forEach(t => {
                if (counts[t.category] !== undefined) counts[t.category]++;
            });

            adminStatTotalRunners.innerText = localTickets.length.toLocaleString("id-ID");
            adminStatTotalRevenue.innerText = formatCurrency(totalRevenue);
            adminStat21kCount.innerText = counts["21K"].toLocaleString("id-ID");
            adminStat10kCount.innerText = `${counts["10K"].toLocaleString("id-ID")} / ${counts["5K"].toLocaleString("id-ID")}`;
            return;
        }

        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error("Gagal memuat statistik.");
            const stats = await response.json();

            adminStatTotalRunners.innerText = stats.totalRegistrations.toLocaleString("id-ID");
            adminStatTotalRevenue.innerText = formatCurrency(stats.totalRevenue);
            adminStat21kCount.innerText = stats.categoryCounts["21K"].toLocaleString("id-ID");
            
            const tenCount = stats.categoryCounts["10K"] || 0;
            const fiveCount = stats.categoryCounts["5K"] || 0;
            adminStat10kCount.innerText = `${tenCount.toLocaleString("id-ID")} / ${fiveCount.toLocaleString("id-ID")}`;
        } catch (error) {
            console.error("Error fetching stats: ", error);
        }
    }

    // Fetch list of participants
    async function fetchAdminTicketsList() {
        const search = adminSearchInput.value.toLowerCase().trim();

        if (!useBackend) {
            // Local search filtering
            const localTickets = JSON.parse(localStorage.getItem("ipwijarun2026_tickets")) || [];
            adminTicketsList = localTickets.filter(t => 
                t.runnerName.toLowerCase().includes(search) ||
                t.ticketId.toLowerCase().includes(search) ||
                t.email.toLowerCase().includes(search) ||
                t.bibNumber.toLowerCase().includes(search)
            );
            renderAdminTable();
            return;
        }

        try {
            const url = `/api/tickets?search=${encodeURIComponent(search)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Gagal mengambil database peserta.");
            adminTicketsList = await response.json();
            renderAdminTable();
        } catch (error) {
            console.error("Error fetching tickets list: ", error);
        }
    }

    // Render database rows dynamically
    function renderAdminTable() {
        adminTableBody.innerHTML = "";

        if (adminTicketsList.length === 0) {
            adminEmptyState.classList.remove("hidden");
            document.getElementById("adminTable").style.display = "none";
        } else {
            adminEmptyState.classList.add("hidden");
            document.getElementById("adminTable").style.display = "table";

            adminTicketsList.forEach(ticket => {
                const tr = document.createElement("tr");
                
                const medalBadge = ticket.medalEngraving !== '-' ? 
                    `<span class="addon-badge yes">Ya (${ticket.medalEngraving})</span>` : 
                    `<span class="addon-badge no">Tidak</span>`;

                tr.innerHTML = `
                    <td style="font-weight:700; color:var(--color-5k);">${ticket.ticketId}</td>
                    <td style="font-weight:600;">${ticket.bibNumber}</td>
                    <td><span class="addon-badge yes bg-${ticket.category.toLowerCase()}">${ticket.category}</span></td>
                    <td style="font-weight:600; color:#ffffff;">${ticket.runnerName}</td>
                    <td>${ticket.jerseySize}</td>
                    <td>${medalBadge}</td>
                    <td style="font-weight:700; color:var(--color-green);">${formatCurrency(ticket.pricePaid)}</td>
                    <td>
                        <button class="btn-danger-sm btn-delete-participant" data-id="${ticket.ticketId}">
                            <i data-lucide="trash-2"></i> Batal
                        </button>
                    </td>
                `;

                tr.querySelector(".btn-delete-participant").addEventListener("click", () => {
                    cancelRegistration(ticket.ticketId, ticket.runnerName);
                });

                adminTableBody.appendChild(tr);
            });
        }
        lucide.createIcons();
    }

    // Cancel registration and delete participant data
    async function cancelRegistration(ticketId, runnerName) {
        if (!confirm(`Apakah Anda yakin ingin membatalkan pendaftaran ${runnerName} (${ticketId})?\nData akan dihapus secara permanen.`)) {
            return;
        }

        if (!useBackend) {
            // Local deletion
            let localTickets = JSON.parse(localStorage.getItem("ipwijarun2026_tickets")) || [];
            localTickets = localTickets.filter(t => t.ticketId !== ticketId);
            localStorage.setItem("ipwijarun2026_tickets", JSON.stringify(localTickets));
            
            alert(`Pendaftaran ${ticketId} berhasil dibatalkan.`);
            syncData();
            return;
        }

        try {
            const response = await fetch(`/api/tickets/${ticketId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error("Gagal menghapus.");
            const result = await response.json();
            
            alert(result.message);
            syncData();
        } catch (error) {
            console.error("Error canceling registration: ", error);
            alert("Gagal menghubungi server database untuk menghapus data.");
        }
    }

    // Search query input handler
    adminSearchInput.addEventListener("input", () => {
        fetchAdminTicketsList();
    });

    // CSV Database Exporter logic
    btnExportCsv.addEventListener("click", () => {
        if (adminTicketsList.length === 0) {
            alert("Database kosong. Tidak ada data untuk diekspor.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID Tiket,BIB,Kategori,Nama Lengkap,Email,No WhatsApp,Ukuran Jersey,Kontak Darurat,Ukir Medali,Total Pembayaran,Tanggal Pembelian\n";

        adminTicketsList.forEach(t => {
            const row = [
                t.ticketId,
                t.bibNumber,
                t.category,
                `"${t.runnerName.replace(/"/g, '""')}"`,
                t.email,
                t.phone,
                t.jerseySize,
                `"${t.emergencyContact.replace(/"/g, '""')}"`,
                `"${t.medalEngraving.replace(/"/g, '""')}"`,
                t.pricePaid,
                t.purchaseDate
            ].join(",");
            csvContent += row + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `DATABASE_PESERTA_IPWIJARUN2026_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // Sync all data
    function syncData() {
        fetchAdminStats();
        fetchAdminTicketsList();
    }

    // Initial load
    syncData();

    // Helper functions
    function formatCurrency(val) {
        return "Rp " + val.toLocaleString("id-ID");
    }
});
