/* ==========================================================================
   IPWIJARUN2026 TICKETING SYSTEM - PARTICIPANT JAVASCRIPT LOGIC
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // App State
    let currentStep = 1;
    let selectedCategory = null;
    let basePrice = 0;
    let totalPrice = 0;
    let registeredTickets = []; // Loaded dynamically from backend server database or LocalStorage

    // Automatic Database Detection (Full-Stack Fallback to LocalStorage)
    // Runs in backend mode when served by the Express server (port 3000/3005) or via sharing tunnels like Pinggy.
    // If run via VS Code Live Server (ports 5500-5505) or file://, it falls back to LocalStorage.
    const useBackend = window.location.protocol.startsWith("http") && 
                       !["5500", "5501", "5502", "5503", "5504", "5505"].includes(window.location.port);

    if (!useBackend) {
        console.warn("IPWIJARUN2026: Berjalan offline/Live Server. Menggunakan LocalStorage sebagai database cadangan.");
        registeredTickets = JSON.parse(localStorage.getItem("ipwijarun2026_tickets")) || [];
    }

    // Constants
    const CATEGORY_PRICES = {
        "5K": 150000,
        "10K": 250000,
        "21K": 400000
    };

    const CATEGORY_NAMES = {
        "5K": "5K Fun Run",
        "10K": "10K Power Run",
        "21K": "21K Half Marathon"
    };

    const CATEGORY_START_TIMES = {
        "5K": "06:15 WIB",
        "10K": "05:45 WIB",
        "21K": "05:00 WIB"
    };

    // DOM Screens
    const landingScreen = document.getElementById("landingScreen");
    const myTicketsScreen = document.getElementById("myTicketsScreen");
    
    // Nav Buttons
    const navBtnHome = document.getElementById("navBtnHome");
    const navBtnKategori = document.getElementById("navBtnKategori");
    const navBtnJadwal = document.getElementById("navBtnJadwal");
    const navBtnFaq = document.getElementById("navBtnFaq");
    const btnOpenMyTickets = document.getElementById("btnOpenMyTickets");
    const btnBackToHome = document.getElementById("btnBackToHome");
    const navLogo = document.getElementById("navLogo");
    const btnGoToShop = document.getElementById("btnGoToShop");

    // Checkout Modal Elements
    const checkoutModal = document.getElementById("checkoutModal");
    const btnCloseCheckoutModal = document.getElementById("btnCloseCheckoutModal");
    const btnStepPrev = document.getElementById("btnStepPrev");
    const btnStepNext = document.getElementById("btnStepNext");
    
    // Checkout Forms & Steps
    const checkoutForm = document.getElementById("checkoutForm");
    const formStep1 = document.getElementById("formStep1");
    const formStep2 = document.getElementById("formStep2");
    const formStep3 = document.getElementById("formStep3");
    const stepNode1 = document.getElementById("stepNode1");
    const stepNode2 = document.getElementById("stepNode2");
    const stepNode3 = document.getElementById("stepNode3");
    const stepProgressFill = document.getElementById("stepProgressFill");
    
    // Checkout Add-ons
    const chkAddonMedal = document.getElementById("chkAddonMedal");
    const groupMedalName = document.getElementById("groupMedalName");
    const inputMedalName = document.getElementById("inputMedalName");
    
    // Checkout Summary Elements
    const modalCategoryBadge = document.getElementById("modalCategoryBadge");
    const modalTitle = document.getElementById("modalTitle");
    const modalSubtitle = document.getElementById("modalSubtitle");
    const summaryCategoryText = document.getElementById("summaryCategoryText");
    const summaryBasePrice = document.getElementById("summaryBasePrice");
    const rowAddonMedal = document.getElementById("rowAddonMedal");

    const summaryTotalPrice = document.getElementById("summaryTotalPrice");
    
    // Payments
    const paymentMethods = document.querySelectorAll(".payment-method-card");
    const detailQris = document.getElementById("detailQris");
    const detailVa = document.getElementById("detailVa");
    const detailCc = document.getElementById("detailCc");
    const btnCopyVa = document.getElementById("btnCopyVa");
    const vaNumberEl = document.getElementById("vaNumber");
    const qrisQrMock = document.getElementById("qrisQrCodeImage");

    // E-Ticket Modal Elements
    const ticketModal = document.getElementById("ticketModal");
    const btnCloseTicketModal = document.getElementById("btnCloseTicketModal");
    const btnCloseTicket = document.getElementById("btnCloseTicket");
    const btnDownloadTicket = document.getElementById("btnDownloadTicket");
    const btnShareTicket = document.getElementById("btnShareTicket");
    const ticketPrintArea = document.getElementById("ticketPrintArea");
    
    const ticketHeaderTheme = document.getElementById("ticketHeaderTheme");
    const ticketBib = document.getElementById("ticketBib");
    const ticketCategory = document.getElementById("ticketCategory");
    const ticketStartTime = document.getElementById("ticketStartTime");
    const ticketRunnerName = document.getElementById("ticketRunnerName");
    const ticketJerseySizeText = document.getElementById("ticketJerseySizeText");
    const ticketEmergencyText = document.getElementById("ticketEmergencyText");
    const ticketMedalEngravingText = document.getElementById("ticketMedalEngravingText");
    const ticketQrImage = document.getElementById("ticketQrImage");
    const ticketIdSpan = document.getElementById("ticketIdSpan");

    // Dashboard Ticket Saya Elements
    const ticketsGrid = document.getElementById("ticketsGrid");
    const ticketsEmptyState = document.getElementById("ticketsEmptyState");
    const ticketSearchInput = document.getElementById("ticketSearchInput");
    
    // Ticket Login Dashboard Elements
    const ticketLoginContainer = document.getElementById("ticketLoginContainer");
    const ticketDashboardContainer = document.getElementById("ticketDashboardContainer");
    const ticketLoginForm = document.getElementById("ticketLoginForm");
    const inputLoginBib = document.getElementById("inputLoginBib");
    const loggedInUserBib = document.getElementById("loggedInUserBib");
    const btnTicketLogout = document.getElementById("btnTicketLogout");

    let loggedInBib = sessionStorage.getItem("ipwijarun_logged_in_bib") || null;
    const filterButtons = document.querySelectorAll(".filter-group .filter-btn");

    /* ==========================================================================
       1. DATA FETCHING (API SYNC / LOCALSTORAGE FALLBACK)
       ========================================================================== */

    // Fetch user tickets
    async function fetchUserTickets() {
        if (!useBackend) {
            registeredTickets = JSON.parse(localStorage.getItem("ipwijarun2026_tickets")) || [];
            if (!myTicketsScreen.classList.contains("hidden")) {
                renderTicketsList();
            }
            return;
        }

        try {
            const response = await fetch('/api/tickets');
            if (!response.ok) throw new Error("Gagal memuat tiket.");
            registeredTickets = await response.json();
            
            if (!myTicketsScreen.classList.contains("hidden")) {
                renderTicketsList();
            }
        } catch (error) {
            console.error("Error fetching tickets: ", error);
        }
    }

    // Fetch quota slots from server or calculate locally
    async function fetchQuotaStats() {
        if (!useBackend) {
            // Local calculation based on local registered tickets
            const counts = { "5K": 0, "10K": 0, "21K": 0 };
            registeredTickets.forEach(t => {
                if (counts[t.category] !== undefined) counts[t.category]++;
            });

            const slotsLeft = {
                "5K": Math.max(0, 1000 - counts["5K"]),
                "10K": Math.max(0, 800 - counts["10K"]),
                "21K": Math.max(0, 500 - counts["21K"])
            };
            updateQuotaCards(slotsLeft);
            return;
        }

        try {
            const response = await fetch('/api/stats');
            if (!response.ok) throw new Error("Gagal mengambil statistik.");
            const stats = await response.json();
            updateQuotaCards(stats.slotsLeft);
        } catch (error) {
            console.error("Error fetching quota stats: ", error);
        }
    }

    // Update remaining slots visual bars & text labels
    function updateQuotaCards(slotsLeft) {
        const totalSlots = { "5K": 1000, "10K": 800, "21K": 500 };
        
        const quota5k = slotsLeft["5K"] !== undefined ? slotsLeft["5K"] : 124;
        const pct5k = (quota5k / totalSlots["5K"]) * 100;
        document.getElementById("quotaBar5k").style.width = `${pct5k}%`;
        document.getElementById("quotaText5k").innerText = `${quota5k} Slot Tersisa`;

        const quota10k = slotsLeft["10K"] !== undefined ? slotsLeft["10K"] : 45;
        const pct10k = (quota10k / totalSlots["10K"]) * 100;
        document.getElementById("quotaBar10k").style.width = `${pct10k}%`;
        document.getElementById("quotaText10k").innerText = `${quota10k} Slot Tersisa`;

        const quota21k = slotsLeft["21K"] !== undefined ? slotsLeft["21K"] : 106;
        const pct21k = (quota21k / totalSlots["21K"]) * 100;
        document.getElementById("quotaBar21k").style.width = `${pct21k}%`;
        document.getElementById("quotaText21k").innerText = `${quota21k} Slot Tersisa`;
    }

    // Initial data synchronization
    async function syncData() {
        await fetchQuotaStats(); // Gets quota remaining
        await fetchUserTickets(); // Gets booked tickets
        checkQueryParameters(); // Check if ticketId is passed in URL
    }

    syncData();

    /* ==========================================================================
       2. COUNTDOWN TIMER
       ========================================================================== */
    const targetDate = new Date("October 25, 2026 05:00:00 GMT+0700").getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            document.getElementById("countdownContainer").innerHTML = "<h3>EVENT TELAH DIMULAI!</h3>";
            return;
        }

        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        document.getElementById("countdownDays").innerText = days.toString().padStart(2, '0');
        document.getElementById("countdownHours").innerText = hours.toString().padStart(2, '0');
        document.getElementById("countdownMinutes").innerText = minutes.toString().padStart(2, '0');
        document.getElementById("countdownSeconds").innerText = seconds.toString().padStart(2, '0');
    }

    setInterval(updateCountdown, 1000);
    updateCountdown();

    /* ==========================================================================
       3. SPA SCREEN NAVIGATION
       ========================================================================== */
    function showScreen(screen) {
        landingScreen.classList.add("hidden");
        myTicketsScreen.classList.add("hidden");

        document.querySelectorAll(".nav-links .nav-item").forEach(item => {
            item.classList.remove("active");
        });

        if (screen === "home") {
            landingScreen.classList.remove("hidden");
            navBtnHome.classList.add("active");
            syncData();
        } else if (screen === "tickets") {
            myTicketsScreen.classList.remove("hidden");
            updateTicketScreenVisibility();
            fetchUserTickets();
        }
        window.scrollTo(0, 0);
    }

    document.querySelectorAll(".nav-links .nav-item").forEach(item => {
        item.addEventListener("click", () => {
            const target = item.getAttribute("href");
            if (target && target.startsWith("#") && target !== "#") {
                showScreen("home");
                document.querySelectorAll(".nav-links .nav-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
            }
        });
    });

    navLogo.addEventListener("click", (e) => {
        e.preventDefault();
        showScreen("home");
    });

    btnOpenMyTickets.addEventListener("click", () => showScreen("tickets"));
    btnBackToHome.addEventListener("click", () => showScreen("home"));
    
    btnGoToShop.addEventListener("click", () => {
        showScreen("home");
        setTimeout(() => {
            document.getElementById("kategori").scrollIntoView({ behavior: "smooth" });
        }, 100);
    });

    /* ==========================================================================
       4. INTERACTIVE ROUTE SELECTOR
       ========================================================================== */
    const routeBtns = document.querySelectorAll(".route-btn");
    const routeMaps = {
        "5k": document.getElementById("routeMap5k"),
        "10k": document.getElementById("routeMap10k"),
        "21k": document.getElementById("routeMap21k")
    };

    routeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            routeBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            const route = btn.dataset.route;
            Object.keys(routeMaps).forEach(k => {
                if (k === route) {
                    routeMaps[k].classList.remove("hidden");
                } else {
                    routeMaps[k].classList.add("hidden");
                }
            });
        });
    });

    /* ==========================================================================
       5. FAQ ACCORDION
       ========================================================================== */
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach(item => {
        const question = item.querySelector(".faq-question");
        const answer = item.querySelector(".faq-answer");

        question.addEventListener("click", () => {
            const isActive = item.classList.contains("active");

            faqItems.forEach(fit => {
                fit.classList.remove("active");
                fit.querySelector(".faq-answer").style.maxHeight = null;
            });

            if (!isActive) {
                item.classList.add("active");
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    /* ==========================================================================
       6. REGISTRATION FLOW (MULTI-STEP MODAL)
       ========================================================================== */
    document.querySelectorAll(".btn-select-category").forEach(btn => {
        btn.addEventListener("click", () => {
            selectedCategory = btn.dataset.category;
            basePrice = CATEGORY_PRICES[selectedCategory];
            
            modalCategoryBadge.innerText = selectedCategory;
            modalCategoryBadge.className = `modal-category-badge bg-${selectedCategory.toLowerCase()}`;
            modalTitle.innerText = `Registrasi ${CATEGORY_NAMES[selectedCategory]}`;
            modalSubtitle.innerText = `Lengkapi formulir pendaftaran untuk kategori lari ${selectedCategory}`;
            summaryCategoryText.innerText = `Tiket ${CATEGORY_NAMES[selectedCategory]}`;
            summaryBasePrice.innerText = formatCurrency(basePrice);
            
            let accentColor = "var(--color-5k)";
            if (selectedCategory === "10K") accentColor = "var(--color-10k)";
            if (selectedCategory === "21K") accentColor = "var(--color-21k)";
            stepProgressFill.style.backgroundColor = accentColor;
            
            checkoutForm.reset();
            groupMedalName.classList.add("hidden");
            rowAddonMedal.classList.add("hidden");

            selectPaymentMethod("qris");
            
            currentStep = 1;
            updateStepView();
            
            checkoutModal.classList.remove("hidden");
            document.body.style.overflow = "hidden";
        });
    });

    function closeCheckoutModal() {
        checkoutModal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    btnCloseCheckoutModal.addEventListener("click", closeCheckoutModal);

    chkAddonMedal.addEventListener("change", () => {
        if (chkAddonMedal.checked) {
            groupMedalName.classList.remove("hidden");
            rowAddonMedal.classList.remove("hidden");
            inputMedalName.setAttribute("required", "true");
        } else {
            groupMedalName.classList.add("hidden");
            rowAddonMedal.classList.add("hidden");
            inputMedalName.removeAttribute("required");
            inputMedalName.value = "";
        }
        calculateTotal();
    });


    function calculateTotal() {
        let addOnMedalCost = chkAddonMedal.checked ? 30000 : 0;
        totalPrice = basePrice + addOnMedalCost;
        
        summaryTotalPrice.innerText = formatCurrency(totalPrice);
    }

    btnStepNext.addEventListener("click", () => {
        if (currentStep === 1) {
            if (validateStep1Inputs()) {
                currentStep = 2;
                calculateTotal();
                updateStepView();
            }
        } else if (currentStep === 2) {
            if (validateStep2Inputs()) {
                currentStep = 3;
                generatePaymentDetails();
                updateStepView();
            }
        } else if (currentStep === 3) {
            if (validatePaymentDetails()) {
                processMockPayment();
            }
        }
    });

    btnStepPrev.addEventListener("click", () => {
        if (currentStep > 1) {
            currentStep--;
            updateStepView();
        }
    });

    function updateStepView() {
        formStep1.classList.add("hidden");
        formStep2.classList.add("hidden");
        formStep3.classList.add("hidden");

        stepNode1.classList.remove("active", "completed");
        stepNode2.classList.remove("active", "completed");
        stepNode3.classList.remove("active", "completed");

        if (currentStep === 1) {
            formStep1.classList.remove("hidden");
            stepNode1.classList.add("active");
            btnStepPrev.setAttribute("disabled", "true");
            btnStepNext.innerHTML = 'Lanjut <i data-lucide="arrow-right"></i>';
            stepProgressFill.style.width = "0%";
        } else if (currentStep === 2) {
            formStep2.classList.remove("hidden");
            stepNode1.classList.add("completed");
            stepNode2.classList.add("active");
            btnStepPrev.removeAttribute("disabled");
            btnStepNext.innerHTML = 'Lanjut Ke Pembayaran <i data-lucide="arrow-right"></i>';
            stepProgressFill.style.width = "50%";
        } else if (currentStep === 3) {
            formStep3.classList.remove("hidden");
            stepNode1.classList.add("completed");
            stepNode2.classList.add("completed");
            stepNode3.classList.add("active");
            btnStepPrev.removeAttribute("disabled");
            btnStepNext.innerHTML = '<i data-lucide="credit-card"></i> Konfirmasi Pembayaran';
            stepProgressFill.style.width = "100%";
        }
        
        lucide.createIcons();
    }

    function validateStep1Inputs() {
        const name = document.getElementById("inputFullName");
        const email = document.getElementById("inputEmail");
        const phone = document.getElementById("inputPhone");
        const dob = document.getElementById("inputBirthDate");
        const size = document.getElementById("inputJerseySize");
        const emergency = document.getElementById("inputEmergencyPhone");

        if (!name.value.trim()) { alert("Nama lengkap wajib diisi."); name.focus(); return false; }
        if (!email.value.trim() || !validateEmail(email.value)) { alert("Alamat email tidak valid."); email.focus(); return false; }
        if (!phone.value.trim() || phone.value.length < 9) { alert("Nomor WhatsApp tidak valid."); phone.focus(); return false; }
        if (!dob.value) { alert("Tanggal lahir wajib diisi."); dob.focus(); return false; }
        if (!size.value) { alert("Pilih ukuran jersey lari Anda."); size.focus(); return false; }
        if (!emergency.value.trim()) { alert("Kontak darurat wajib diisi."); emergency.focus(); return false; }

        return true;
    }

    function validateStep2Inputs() {
        if (chkAddonMedal.checked && !inputMedalName.value.trim()) {
            alert("Harap masukkan nama untuk diukir pada medali.");
            inputMedalName.focus();
            return false;
        }
        return true;
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }

    /* ==========================================================================
       7. PAYMENT SELECTION & SIMULATION
       ========================================================================== */
    paymentMethods.forEach(card => {
        card.addEventListener("click", () => {
            const method = card.dataset.method;
            selectPaymentMethod(method);
        });
    });

    function selectPaymentMethod(method) {
        paymentMethods.forEach(c => c.classList.remove("active"));
        const activeCard = document.querySelector(`.payment-method-card[data-method="${method}"]`);
        if (activeCard) activeCard.classList.add("active");

        detailQris.classList.add("hidden");
        detailVa.classList.add("hidden");
        detailCc.classList.add("hidden");

        if (method === "qris") {
            detailQris.classList.remove("hidden");
        } else if (method === "va") {
            detailVa.classList.remove("hidden");
        } else if (method === "cc") {
            detailCc.classList.remove("hidden");
        }
    }

    function generatePaymentDetails() {
        const randVa = "8830 18" + Math.floor(1000000000 + Math.random() * 9000000000).toString().replace(/(\d{4})/g, '$1 ').trim();
        vaNumberEl.innerText = randVa;

        const randomRef = "RUN26-" + Math.random().toString(36).substring(3, 9).toUpperCase();
        const qrData = `https://pay.ipwijarun2026.id/checkout/${randomRef}?amt=${totalPrice}`;
        
        qrisQrMock.style.backgroundImage = `url('https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}')`;
    }

    btnCopyVa.addEventListener("click", () => {
        navigator.clipboard.writeText(vaNumberEl.innerText.replace(/\s/g, ''));
        btnCopyVa.innerHTML = '<i data-lucide="check"></i> Tersalin';
        lucide.createIcons();
        setTimeout(() => {
            btnCopyVa.innerHTML = '<i data-lucide="copy"></i> Salin';
            lucide.createIcons();
        }, 2000);
    });

    function validatePaymentDetails() {
        const activeMethod = document.querySelector(".payment-method-card.active").dataset.method;
        if (activeMethod === "cc") {
            const ccNum = document.getElementById("ccNum");
            const ccExp = document.getElementById("ccExpiry");
            const ccCvv = document.getElementById("ccCvv");

            if (!ccNum.value.trim() || ccNum.value.replace(/\s/g, '').length < 16) {
                alert("Masukkan nomor kartu kredit 16 digit yang valid.");
                ccNum.focus();
                return false;
            }
            if (!ccExp.value.trim() || !ccExp.value.includes("/")) {
                alert("Masukkan masa berlaku kartu (MM/YY) yang valid.");
                ccExp.focus();
                return false;
            }
            if (!ccCvv.value.trim() || ccCvv.value.length < 3) {
                alert("Masukkan CVV kartu kredit Anda (3 digit).");
                ccCvv.focus();
                return false;
            }
        }
        return true;
    }

    document.getElementById("ccNum").addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, '');
        e.target.value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    });

    document.getElementById("ccExpiry").addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            e.target.value = value.substring(0, 2) + '/' + value.substring(2, 4);
        } else {
            e.target.value = value;
        }
    });

    /* ==========================================================================
       8. DB POST REGISTRATION SUBMIT
       ========================================================================== */
    function processMockPayment() {
        btnStepNext.setAttribute("disabled", "true");
        btnStepNext.innerText = "Memproses...";

        const ticketPayload = {
            category: selectedCategory,
            runnerName: document.getElementById("inputFullName").value.trim(),
            email: document.getElementById("inputEmail").value.trim(),
            phone: document.getElementById("inputPhone").value.trim(),
            jerseySize: document.getElementById("inputJerseySize").value,
            emergencyContact: document.getElementById("inputEmergencyPhone").value.trim(),
            medalEngraving: chkAddonMedal.checked ? inputMedalName.value.trim() : "-",
            shippingAddress: "-"
        };

        // Offline Fallback logic
        if (!useBackend) {
            setTimeout(() => {
                const randId = "T26-" + selectedCategory.replace('K', '') + "-" + Math.floor(10000 + Math.random() * 90000);
                const randBib = "BIB: R26-" + selectedCategory.replace('K', '') + "-" + Math.floor(1000 + Math.random() * 9000);
                
                const localTicket = {
                    ticketId: randId,
                    bibNumber: randBib,
                    category: selectedCategory,
                    ...ticketPayload,
                    pricePaid: totalPrice,
                    purchaseDate: new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' }),
                    createdAt: new Date().toISOString()
                };

                registeredTickets.unshift(localTicket);
                localStorage.setItem("ipwijarun2026_tickets", JSON.stringify(registeredTickets));

                // Auto login user with their new BIB number
                loggedInBib = localTicket.bibNumber;
                sessionStorage.setItem("ipwijarun_logged_in_bib", loggedInBib);
                updateTicketScreenVisibility();

                closeCheckoutModal();

                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.6 }
                });

                openTicketViewer(localTicket);
                fetchUserTickets();
                fetchQuotaStats();

                btnStepNext.removeAttribute("disabled");
                btnStepNext.innerHTML = '<i data-lucide="credit-card"></i> Konfirmasi Pembayaran';
                lucide.createIcons();
            }, 1200);
            return;
        }

        // Online (REST API) logic
        fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ticketPayload)
        })
        .then(response => {
            if (!response.ok) throw new Error("Gagal menyimpan data ke database server.");
            return response.json();
        })
        .then(createdTicket => {
            closeCheckoutModal();

            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });

            // Auto login user with their new BIB number
            loggedInBib = createdTicket.bibNumber;
            sessionStorage.setItem("ipwijarun_logged_in_bib", loggedInBib);
            updateTicketScreenVisibility();

            openTicketViewer(createdTicket);
            fetchUserTickets();
            fetchQuotaStats();
        })
        .catch(error => {
            console.error("Error submitting registration: ", error);
            alert("Terjadi kesalahan sistem saat menghubungi server database. Pastikan backend server Anda menyala.");
        })
        .finally(() => {
            btnStepNext.removeAttribute("disabled");
            btnStepNext.innerHTML = '<i data-lucide="credit-card"></i> Konfirmasi Pembayaran';
            lucide.createIcons();
        });
    }

    /* ==========================================================================
       9. E-TICKET LAYOUT RENDER & IMAGE DOWNLOAD
       ========================================================================== */
    function openTicketViewer(ticket) {
        ticketBib.innerText = ticket.bibNumber;
        ticketCategory.innerText = CATEGORY_NAMES[ticket.category];
        ticketStartTime.innerText = CATEGORY_START_TIMES[ticket.category];
        ticketRunnerName.innerText = ticket.runnerName;
        ticketJerseySizeText.innerText = ticket.jerseySize;
        ticketEmergencyText.innerText = ticket.emergencyContact;
        ticketMedalEngravingText.innerText = ticket.medalEngraving;
        ticketIdSpan.innerText = ticket.ticketId;

        ticketHeaderTheme.className = "ticket-main";
        ticketHeaderTheme.classList.add(`theme-${ticket.category.toLowerCase()}`);

        const ticketUrl = `https://ipwijarun2026.id/verify/${ticket.ticketId}`;
        ticketQrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(ticketUrl)}`;

        ticketModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";

        const newDownloadBtn = btnDownloadTicket.cloneNode(true);
        btnDownloadTicket.parentNode.replaceChild(newDownloadBtn, btnDownloadTicket);
        
        // Setup Share Button
        const newShareBtn = btnShareTicket.cloneNode(true);
        btnShareTicket.parentNode.replaceChild(newShareBtn, btnShareTicket);

        newShareBtn.addEventListener("click", () => {
            const shareUrl = `${window.location.origin}${window.location.pathname}?ticketId=${ticket.ticketId}`;
            const shareTitle = `E-Ticket IPWIJARUN2026`;
            const shareText = `Halo! Ini E-Ticket IPWIJARUN2026 saya atas nama *${ticket.runnerName}*. Kategori lari: ${ticket.category}.`;

            if (navigator.share) {
                navigator.share({
                    title: shareTitle,
                    text: shareText,
                    url: shareUrl
                }).then(() => {
                    console.log("Berhasil dibagikan!");
                }).catch(err => {
                    console.error("Gagal membagikan:", err);
                });
            } else {
                // Fallback copy to clipboard
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("Tautan E-Ticket berhasil disalin ke clipboard! Silakan bagikan ke WhatsApp atau media sosial Anda.");
                }).catch(err => {
                    console.error("Gagal menyalin link:", err);
                    alert(`Tautan tiket Anda: ${shareUrl}`);
                });
            }
        });

        newDownloadBtn.addEventListener("click", () => {
            newDownloadBtn.setAttribute("disabled", "true");
            newDownloadBtn.innerHTML = '<span class="spinner"></span> Mengunduh...';
            
            html2canvas(ticketPrintArea, {
                scale: 2,
                backgroundColor: "#070a13",
                useCORS: true,
                logging: false
            }).then(canvas => {
                const imgData = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.download = `ETICKET_${ticket.runnerName.replace(/\s+/g, '_').toUpperCase()}_${ticket.ticketId}.png`;
                link.href = imgData;
                link.click();

                newDownloadBtn.removeAttribute("disabled");
                newDownloadBtn.innerHTML = '<i data-lucide="download"></i> Download E-Ticket (PNG)';
                lucide.createIcons();
            }).catch(err => {
                console.error("Canvas export failed: ", err);
                alert("Gagal mengunduh gambar. Silakan gunakan tangkapan layar (screenshot) sebagai gantinya.");
                newDownloadBtn.removeAttribute("disabled");
                newDownloadBtn.innerHTML = '<i data-lucide="download"></i> Download E-Ticket (PNG)';
                lucide.createIcons();
            });
        });
    }

    function closeTicketModal() {
        ticketModal.classList.add("hidden");
        document.body.style.overflow = "";
    }

    btnCloseTicketModal.addEventListener("click", closeTicketModal);
    btnCloseTicket.addEventListener("click", closeTicketModal);

    /* ==========================================================================
       9.5 TICKET ACCESS LOGIN LOGIC
       ========================================================================== */
    function updateTicketScreenVisibility() {
        if (loggedInBib) {
            ticketLoginContainer.classList.add("hidden");
            ticketDashboardContainer.classList.remove("hidden");
            loggedInUserBib.innerText = loggedInBib;
        } else {
            ticketLoginContainer.classList.remove("hidden");
            ticketDashboardContainer.classList.add("hidden");
            inputLoginBib.value = "";
        }
    }

    ticketLoginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const inputVal = inputLoginBib.value.toUpperCase().trim();
        const searchKey = inputVal.replace(/^(BIB\s*:\s*)/i, '').replace(/\s+/g, '');

        if (!searchKey) {
            alert("Harap masukkan nomor BIB atau ID Tiket yang valid.");
            return;
        }

        // Look for matching ticket
        const found = registeredTickets.find(t => {
            const tBibNormalized = t.bibNumber.toUpperCase().replace(/^(BIB\s*:\s*)/i, '').replace(/\s+/g, '');
            const tIdNormalized = t.ticketId.toUpperCase().replace(/\s+/g, '');
            return tBibNormalized === searchKey || tIdNormalized === searchKey;
        });

        if (found) {
            // Login successful!
            loggedInBib = found.bibNumber; // Use the exact bibNumber string
            sessionStorage.setItem("ipwijarun_logged_in_bib", loggedInBib);
            updateTicketScreenVisibility();
            renderTicketsList();
        } else {
            alert("Nomor BIB atau ID Tiket tidak ditemukan di database peserta.\nPastikan format yang Anda masukkan benar.");
        }
    });

    btnTicketLogout.addEventListener("click", () => {
        loggedInBib = null;
        sessionStorage.removeItem("ipwijarun_logged_in_bib");
        updateTicketScreenVisibility();
    });

    /* ==========================================================================
       10. PARTICIPANT TICKET Saya PANEL
       ========================================================================== */
    let currentFilter = "all";

    function renderTicketsList() {
        ticketsGrid.innerHTML = "";

        const searchQuery = ticketSearchInput.value.toLowerCase().trim();
        
        const filteredTickets = registeredTickets.filter(ticket => {
            // Must match the logged-in user's BIB or Ticket ID (case-insensitive lookup)
            const tBibNormalized = ticket.bibNumber.toUpperCase().replace(/^(BIB\s*:\s*)/i, '').replace(/\s+/g, '');
            const tIdNormalized = ticket.ticketId.toUpperCase().replace(/\s+/g, '');
            const loginKeyNormalized = loggedInBib ? loggedInBib.toUpperCase().replace(/^(BIB\s*:\s*)/i, '').replace(/\s+/g, '') : "";
            
            const matchesLogin = loggedInBib && (tBibNormalized === loginKeyNormalized || tIdNormalized === loginKeyNormalized);
            
            const matchesFilter = currentFilter === "all" || ticket.category === currentFilter;
            const matchesSearch = ticket.runnerName.toLowerCase().includes(searchQuery) || 
                                  ticket.ticketId.toLowerCase().includes(searchQuery) ||
                                  ticket.bibNumber.toLowerCase().includes(searchQuery);
            return matchesLogin && matchesFilter && matchesSearch;
        });

        if (filteredTickets.length === 0) {
            if (searchQuery || currentFilter !== "all") {
                ticketsGrid.appendChild(createEmptySearchResultState());
            } else {
                ticketsGrid.appendChild(ticketsEmptyState);
                ticketsEmptyState.classList.remove("hidden");
            }
        } else {
            ticketsEmptyState.classList.add("hidden");
            filteredTickets.forEach(ticket => {
                const card = createTicketCardElement(ticket);
                ticketsGrid.appendChild(card);
            });
        }
        lucide.createIcons();
    }

    function createTicketCardElement(ticket) {
        const div = document.createElement("div");
        div.className = "purchased-ticket-card";
        
        let bgClass = `bg-${ticket.category.toLowerCase()}`;
        
        div.innerHTML = `
            <div class="ticket-card-header">
                <span class="ticket-card-badge ${bgClass}">${CATEGORY_NAMES[ticket.category]}</span>
                <span class="ticket-card-bib">${ticket.bibNumber}</span>
            </div>
            <div class="ticket-card-body">
                <div class="ticket-row">
                    <span class="t-label">Nama Peserta:</span>
                    <span class="t-value bold">${ticket.runnerName}</span>
                </div>
                <div class="ticket-row">
                    <span class="t-label">ID Tiket:</span>
                    <span class="t-value">${ticket.ticketId}</span>
                </div>
                <div class="ticket-row">
                    <span class="t-label">Ukuran Jersey:</span>
                    <span class="t-value">${ticket.jerseySize}</span>
                </div>
                <div class="ticket-row">
                    <span class="t-label">Tanggal Pemesanan:</span>
                    <span class="t-value">${ticket.purchaseDate}</span>
                </div>
            </div>
            <div class="ticket-card-footer">
                <button class="btn btn-secondary btn-full btn-view-eticket">
                    <i data-lucide="eye"></i> Lihat E-Ticket
                </button>
            </div>
        `;

        div.querySelector(".btn-view-eticket").addEventListener("click", () => {
            openTicketViewer(ticket);
        });

        return div;
    }

    function createEmptySearchResultState() {
        const div = document.createElement("div");
        div.className = "empty-state";
        div.innerHTML = `
            <i data-lucide="search" class="empty-icon"></i>
            <h3>Tiket Tidak Ditemukan</h3>
            <p>Tidak ada tiket marathon yang cocok dengan kata kunci pencarian Anda. Silakan coba kata kunci lain.</p>
        `;
        return div;
    }

    ticketSearchInput.addEventListener("input", renderTicketsList);

    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentFilter = btn.dataset.filter;
            renderTicketsList();
        });
    });

    /* ==========================================================================
       11. UTILITIES & NOTIFICATIONS
       ========================================================================== */
    // Check if ticketId query parameter exists in URL and open it directly
    function checkQueryParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const ticketIdParam = urlParams.get('ticketId');
        if (ticketIdParam) {
            setTimeout(() => {
                const ticket = registeredTickets.find(t => t.ticketId === ticketIdParam);
                if (ticket) {
                    openTicketViewer(ticket);
                } else if (useBackend) {
                    fetch(`/api/tickets/${ticketIdParam}`)
                        .then(res => {
                            if (res.ok) return res.json();
                            throw new Error();
                        })
                        .then(t => {
                            openTicketViewer(t);
                        })
                        .catch(() => {
                            console.warn("Tiket dari parameter URL tidak ditemukan di database.");
                        });
                }
            }, 800); // Wait 800ms for tickets list to sync first
        }
    }

    function formatCurrency(val) {
        return "Rp " + val.toLocaleString("id-ID");
    }
});
