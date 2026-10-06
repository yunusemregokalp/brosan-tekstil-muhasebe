import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import datetime

# Target file paths
target_file = r"C:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\İBKB\GELEN PARALAR - İBKB BROSAN.xlsx"
islenmis_file = r"C:\Users\YUNUS EMRE GÖKALP\OneDrive\Masaüstü\MUHASEBE BROSAN TEKSTİL\İBKB\GELEN PARALAR - İBKB BROSAN - İŞLENMİŞ.xlsx"

wb = openpyxl.Workbook()
default_sheet = wb.active

# -------------------------------------------------------------
# TYPOGRAPHY & DESIGN PALETTE (Corporate Accounting Excellence)
# -------------------------------------------------------------
font_title = Font(name="Segoe UI", size=14, bold=True, color="1B365D")
font_sub = Font(name="Segoe UI", size=9, italic=True, color="595959")
font_section = Font(name="Segoe UI", size=11, bold=True, color="1B365D")
font_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
font_data = Font(name="Segoe UI", size=9.5, bold=False, color="1A1A1A")
font_data_bold = Font(name="Segoe UI", size=9.5, bold=True, color="1A1A1A")
font_yapildi = Font(name="Segoe UI", size=9.5, bold=True, color="1E6B37")
font_yapilacak = Font(name="Segoe UI", size=9.5, bold=True, color="8A5300")
font_kapandi = Font(name="Segoe UI", size=9.5, bold=True, color="1E6B37")
font_acik = Font(name="Segoe UI", size=9.5, bold=True, color="8A5300")

fill_navy_header = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
fill_subtotal = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")
fill_yapildi = PatternFill(start_color="E2EFDA", end_color="E2EFDA", fill_type="solid")
fill_yapilacak = PatternFill(start_color="FFF2CC", end_color="FFF2CC", fill_type="solid")
fill_zebra = PatternFill(start_color="F9FAFC", end_color="F9FAFC", fill_type="solid")
fill_card_bg = PatternFill(start_color="F2F4F8", end_color="F2F4F8", fill_type="solid")

thin_gray = Side(style="thin", color="D9D9D9")
double_bottom = Side(style="double", color="1B365D")
thick_top = Side(style="thin", color="1B365D")

border_cell = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thin_gray)
border_header = Border(left=thin_gray, right=thin_gray, top=thin_gray, bottom=thick_top)
border_total = Border(top=thick_top, bottom=double_bottom, left=thin_gray, right=thin_gray)

align_left = Alignment(horizontal="left", vertical="center")
align_center = Alignment(horizontal="center", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")
align_header = Alignment(horizontal="center", vertical="center", wrap_text=True)

# -------------------------------------------------------------
# 1. ÖZET DASHBOARD SHEET
# -------------------------------------------------------------
ws_dash = wb.create_sheet(title="ÖZET DASHBOARD")
ws_dash.views.sheetView[0].showGridLines = True

ws_dash.merge_cells("A1:G1")
ws_dash["A1"] = "BROSAN TEKSTİL SAN. VE DIŞ TİC. LTD. ŞTİ."
ws_dash["A1"].font = font_title
ws_dash["A1"].alignment = align_left

ws_dash.merge_cells("A2:G2")
ws_dash["A2"] = "İHRACAT BEDELLERİ, BANKA GELEN PARALAR VE İBKB YÖNETİM MERKEZİ"
ws_dash["A2"].font = Font(name="Segoe UI", size=11, bold=True, color="404040")
ws_dash["A2"].alignment = align_left

ws_dash["A3"] = f"Son Güncelleme: {datetime.date.today().strftime('%d.%m.%Y')} | Banka: GARANTİ BBVA BAHÇEŞEHİR ŞUBESİ (KOBİ / ABACUS Müşteri Hizmetleri)"
ws_dash["A3"].font = font_sub
ws_dash["A3"].alignment = align_left

# Section 1: Döviz Cinsi Bazında Durum
ws_dash["A5"] = "1. DÖVİZ CİNSİ BAZINDA İBKB İCMALİ"
ws_dash["A5"].font = font_section

dash_headers_1 = ["DÖVİZ CİNSİ", "TOPLAM GELEN TUTAR", "İBKB YAPILAN TUTAR", "İBKB YAPILACAK (AÇIK)", "KAPANMA ORANI"]
for col_idx, h in enumerate(dash_headers_1, start=1):
    cell = ws_dash.cell(6, col_idx, h)
    cell.font = font_header
    cell.fill = fill_navy_header
    cell.alignment = align_header
    cell.border = border_header
ws_dash.row_dimensions[6].height = 24

currencies = [
    ("EUR", 7),
    ("USD", 8),
    ("GBP", 9)
]

for curr, row_idx in currencies:
    c1 = ws_dash.cell(row_idx, 1, curr)
    c1.font = font_data_bold
    c1.alignment = align_center
    c1.border = border_cell
    
    c2 = ws_dash.cell(row_idx, 2, f"=SUMIFS('GELEN PARALAR'!$B$3:$B$54, 'GELEN PARALAR'!$C$3:$C$54, \"{curr}\")")
    c2.font = font_data_bold
    c2.number_format = "#,##0.00"
    c2.alignment = align_right
    c2.border = border_cell
    
    c3 = ws_dash.cell(row_idx, 3, f"=SUMIFS('GELEN PARALAR'!$I$3:$I$54, 'GELEN PARALAR'!$C$3:$C$54, \"{curr}\")")
    c3.font = font_yapildi
    c3.number_format = "#,##0.00"
    c3.alignment = align_right
    c3.border = border_cell
    
    c4 = ws_dash.cell(row_idx, 4, f"=SUMIFS('GELEN PARALAR'!$J$3:$J$54, 'GELEN PARALAR'!$C$3:$C$54, \"{curr}\")")
    c4.font = font_yapilacak
    c4.number_format = "#,##0.00"
    c4.alignment = align_right
    c4.border = border_cell
    
    c5 = ws_dash.cell(row_idx, 5, f"=IF(B{row_idx}>0, C{row_idx}/B{row_idx}, 0)")
    c5.font = font_data_bold
    c5.number_format = "0.0%"
    c5.alignment = align_center
    c5.border = border_cell
    ws_dash.row_dimensions[row_idx].height = 20

# Section 2: Genel Göstergeler
ws_dash["A11"] = "2. İŞLEM VE BELGE İSTATİSTİKLERİ"
ws_dash["A11"].font = font_section

stat_rows = [
    ("Toplam Gelen Transfer Sayısı", "=COUNTA('GELEN PARALAR'!$A$3:$A$54)", "adet"),
    ("İBKB'si Tamamlanan / Talimat Verilen Transferler", "=COUNTIF('GELEN PARALAR'!$H$3:$H$54, \"YAPILDI\")", "adet"),
    ("İBKB Bekleyen Transferler", "=COUNTIF('GELEN PARALAR'!$H$3:$H$54, \"YAPILACAK\")", "adet"),
    ("Sistemde Kayıtlı İhracat Dosyaları (GB/ETGB)", "=COUNTA('BEYANNAME VE ETGB LER'!$A$2:$A$12)", "dosya"),
    ("Kapanan Beyannameler", "=COUNTIF('BEYANNAME VE ETGB LER'!$K$2:$K$12, \"KAPANDI\")", "dosya"),
    ("Açık / İşlem Bekleyen Beyannameler", "=COUNTIF('BEYANNAME VE ETGB LER'!$K$2:$K$12, \"AÇIK\")", "dosya")
]

ws_dash.merge_cells("A12:C12")
ws_dash["A12"] = "GÖSTERGE"
ws_dash["A12"].font = font_header
ws_dash["A12"].fill = fill_navy_header
ws_dash["A12"].alignment = align_left
ws_dash["A12"].border = border_header

ws_dash["D12"] = "DEĞER"
ws_dash["D12"].font = font_header
ws_dash["D12"].fill = fill_navy_header
ws_dash["D12"].alignment = align_center
ws_dash["D12"].border = border_header

ws_dash["E12"] = "BİRİM"
ws_dash["E12"].font = font_header
ws_dash["E12"].fill = fill_navy_header
ws_dash["E12"].alignment = align_center
ws_dash["E12"].border = border_header
ws_dash.row_dimensions[12].height = 22

for s_idx, (label, formula, unit) in enumerate(stat_rows, start=13):
    ws_dash.merge_cells(f"A{s_idx}:C{s_idx}")
    c_lbl = ws_dash[f"A{s_idx}"]
    c_lbl.value = label
    c_lbl.font = font_data
    c_lbl.alignment = align_left
    c_lbl.border = border_cell
    ws_dash[f"B{s_idx}"].border = border_cell
    ws_dash[f"C{s_idx}"].border = border_cell
    
    c_val = ws_dash[f"D{s_idx}"]
    c_val.value = formula
    c_val.font = font_data_bold
    c_val.alignment = align_center
    c_val.border = border_cell
    
    c_un = ws_dash[f"E{s_idx}"]
    c_un.value = unit
    c_un.font = font_sub
    c_un.alignment = align_center
    c_un.border = border_cell
    ws_dash.row_dimensions[s_idx].height = 19

# Section 3: Acil Aksiyon Listesi
ws_dash["A20"] = "3. ÖNCELİKLİ İBKB TALİMATI VERİLECEK DOSYALAR (HAZIR EVRAK VE PEŞİN DÖVİZLER)"
ws_dash["A20"].font = font_section

action_headers = ["SIRA", "MÜŞTERİ / FİRMA", "BEYANNAME / ETGB NO", "BEYANNAME TARİHİ", "BEKLEYEN DÖVİZ TUTARI", "BANKA", "YAPILACAK AKSİYON"]
for col_idx, h in enumerate(action_headers, start=1):
    cell = ws_dash.cell(21, col_idx, h)
    cell.font = font_header
    cell.fill = fill_navy_header
    cell.alignment = align_header
    cell.border = border_header
ws_dash.row_dimensions[21].height = 24

action_items = [
    (1, "BEN ELLİS (1. YÜKLEME)", "26341453EX017052 (FEDEX)", "01.10.2026", "5.638,10 GBP", "GARANTİ BBVA", "01.09.2026 tarihli 8.525 GBP peşin dövizden 5.638,10 GBP bu ETGB için İBKB yapılacak (Tam Kapatacak)."),
    (2, "BEN ELLİS (2. YÜKLEME)", "26341453EX00267850 (H26-03604)", "05.10.2026", "2.886,90 GBP", "GARANTİ BBVA", "01.09.2026 peşin dövizden arta kalan 2.886,90 GBP bu GB'ye bağlanacak (Kalan 12.139,22 GBP vadeli tahsil edilecek)."),
    (3, "LONG TERM HVAC (EMK)", "26341453EX013808", "06.08.2026", "4.360,50 USD", "GARANTİ BBVA", "3 parça gelen peşin transfer (2.722,50 + 1.300 + 338 $) ETGB tutarını tam kapatıyor. İBKB talimatı verilecek."),
    (4, "Armin Muhamedagic", "26341453EX011110", "26.06.2026", "2.131,92 EUR", "GARANTİ BBVA", "2 parça gelen transfer (976 + 1.166 €) hazır. 2.131,92 EUR ETGB için İBKB talimatı verilecek."),
    (5, "EZC (ASSANI HAMADA)", "26341453EX015433", "02.09.2026", "500,00 EUR", "GARANTİ BBVA", "26.08.2026 tarihli 500 EUR havale hazır. 02.09.2026 tescilli ETGB için İBKB talimatı verilecek.")
]

for a_idx, row in enumerate(action_items, start=22):
    for c_idx, val in enumerate(row, start=1):
        c = ws_dash.cell(a_idx, c_idx, val)
        c.border = border_cell
        if c_idx == 1:
            c.font = font_data_bold
            c.alignment = align_center
        elif c_idx in [2, 3]:
            c.font = font_data_bold
            c.alignment = align_left
        elif c_idx == 4:
            c.font = font_data
            c.alignment = align_center
        elif c_idx == 5:
            c.font = font_yapilacak
            c.alignment = align_right
            c.fill = fill_yapilacak
        elif c_idx == 6:
            c.font = font_data
            c.alignment = align_center
        else:
            c.font = font_data
            c.alignment = align_left
    ws_dash.row_dimensions[a_idx].height = 22

dash_col_widths = {
    "A": 8,
    "B": 28,
    "C": 30,
    "D": 18,
    "E": 24,
    "F": 18,
    "G": 78
}
for col_letter, width in dash_col_widths.items():
    ws_dash.column_dimensions[col_letter].width = width


# -------------------------------------------------------------
# 2. BANKA & İBKB YAZIŞMA TAKİBİ SHEET (NEW AUDIT LOG)
# -------------------------------------------------------------
ws_log = wb.create_sheet(title="BANKA & İBKB YAZIŞMA TAKİBİ")
ws_log.views.sheetView[0].showGridLines = True

ws_log.merge_cells("A1:K1")
ws_log["A1"] = "GARANTİ BBVA BAHÇEŞEHİR ŞUBESİ — İBKB TALİMATLARI VE PARÇALI BOZUM GEÇMİŞİ"
ws_log["A1"].font = font_title
ws_log["A1"].alignment = align_left
ws_log.row_dimensions[1].height = 24

log_headers = [
    "SIRA",
    "FİİLİ İBKB / BOZUM TARİHİ",
    "İLGİLİ MÜŞTERİ / DOSYA",
    "BEYANNAME / ETGB NO",
    "BEYANNAME TARİHİ",
    "HAVALE GELİŞ TARİHİ",
    "BOZDURULAN İBKB TUTARI",
    "DÖVİZ",
    "PARÇA / BOZUM AŞAMASI",
    "İŞLEM DURUMU",
    "DEKONT / İBKB NO VE BANKA NOTU"
]

for col_idx, h in enumerate(log_headers, start=1):
    cell = ws_log.cell(2, col_idx, h)
    cell.font = font_header
    cell.fill = fill_navy_header
    cell.alignment = align_header
    cell.border = border_header
ws_log.row_dimensions[2].height = 28

log_data = [
    (1, datetime.date(2025, 11, 3), "LAURA GOTTFRIED", "25343200EX010314", datetime.date(2025, 9, 22), "28.08 / 22.09.2025", 9205.00, "EUR", "2 Havale Birleşti / Tek Sefer", "YAPILDI (KAPANDI)", "03.11.2025 tarihli 9.205 EUR resmi talimatla 28.08 (5.386 €) ve 22.09 (3.819 €) bedeller %100 bozdurularak İBKB yapıldı."),
    (2, datetime.date(2025, 11, 28), "LAVI LA LLC (1. KISIM)", "25341453EX026501", datetime.date(2025, 11, 13), "14.10.2025 (Peşin)", 9884.48, "USD", "1. Parça Bozum (Kalan: 10.115,52 $)", "YAPILDI (KAPANDI)", "14.10.2025 gelen 20.000 USD peşin bedelden 9.884,48 USD İBKB ve Döviz Dönüşüm Desteği ile bozduruldu."),
    (3, datetime.date(2025, 12, 8), "LAVI LA LLC (2. KISIM)", "25341453EX026501", datetime.date(2025, 11, 13), "14.10.2025 (Peşin)", 10115.52, "USD", "2. Parça Bozum (Tam Kapandı)", "YAPILDI (KAPANDI)", "14.10.2025 gelen 20.000 USD peşin bedelden kalan 10.115,52 USD İBKB yapıldı. 20.000 USD ihracat bedeli 2 parçada tam kapandı."),
    (4, datetime.date(2026, 9, 8), "MARQUE APS", "26341453EX010071", datetime.date(2026, 5, 22), "07.04 / 20.05.2026", 3090.00, "EUR", "2 Havaleden Kısmi Bozum (Kapandı)", "YAPILDI (KAPANDI)", "08.09.2026 13:04'te Ebru Kul'a mail atıldı. ETGB ve faturalar iletildi. 1.830 EUR ve 1.260 EUR İBKB tamamlandı."),
    (5, datetime.date(2026, 9, 14), "PEŞİN İBKB PROSEDÜRÜ", "-", None, "-", 0.0, "-", "Mevzuat / Form Temini", "BİLGİ / EVRAK ALINDI", "Peşin İBKB ön avans evrakları talep edildi. Ebru Hanım Prim Destekli Taahhütname ve KKDF formlarını iletti."),
    (6, datetime.date(2026, 10, 2), "SMEETS GERT", "26341453EX012346", datetime.date(2026, 7, 8), "29.12.2025 / 04.05.2026", 3160.00, "EUR", "1. Parça Bozum (Kalan: 185,60 €)", "YAPILDI (HESABA GEÇTİ)", "02.10.2026 talimatı işleme alındı, banka işlemi tamamlandı ve hesaba geçti. 29.12.2025 (100 €) ve 04.05.2026 (3.060 €) havalelerinden 3.160 EUR İBKB yapıldı."),
    (7, datetime.date(2026, 10, 6), "BEN ELLİS (1. YÜKLEME)", "26341453EX017052", datetime.date(2026, 10, 1), "01.09.2026 (Peşin)", 5638.10, "GBP", "Peşinden 1. Bozum (ETGB Tam Kapar)", "TALİMAT VERİLECEK (HAZIR)", "01.10.2026 tarihli FedEx ETGB'si bugün geldi. 01.09.2026 tarihli 8.525 GBP'den 5.638,10 GBP için İBKB talimatı hazırlanacak."),
    (8, datetime.date(2026, 10, 6), "BEN ELLİS (2. YÜKLEME)", "26341453EX00267850", datetime.date(2026, 10, 5), "01.09.2026 (Peşin)", 2886.90, "GBP", "Peşinden 2. Bozum / GB Mahsubu", "TALİMAT VERİLECEK (HAZIR)", "05.10.2026 tarihli H26-03604 nolu GB'ye mahsuben peşinden kalan 2.886,90 GBP için İBKB talimatı hazırlanacak (GB'nin kalan 12.139,22 GBP'si vadeli tahsil edilecek)."),
    (9, datetime.date(2026, 10, 6), "LONG TERM HVAC (EMK)", "26341453EX013808", datetime.date(2026, 8, 6), "25.06 / 21.07 / 03.08.2026", 4360.50, "USD", "3 Havale Birleşti / Tek Sefer", "TALİMAT VERİLECEK (HAZIR)", "06.08.2026 tarihli ETGB (4.360,50 USD) hazır. Gelen 3 parça ödeme (2.722,50 + 1.300 + 338 $) tam tutuyor. İBKB talimatı verilecek.")
]

for idx, item in enumerate(log_data, start=3):
    sira, ibkb_tarih, musteri, gb_no, gb_tarih, havale_tarih, tutar, doviz, parca_durum, durum, notu = item
    
    c_s = ws_log.cell(idx, 1, sira)
    c_s.font = font_data_bold
    c_s.alignment = align_center
    c_s.border = border_cell
    
    c_t = ws_log.cell(idx, 2, ibkb_tarih)
    c_t.font = font_data_bold
    c_t.number_format = "DD.MM.YYYY"
    c_t.alignment = align_center
    c_t.border = border_cell
    
    c_m = ws_log.cell(idx, 3, musteri)
    c_m.font = font_data_bold
    c_m.alignment = align_left
    c_m.border = border_cell
    
    c_gb = ws_log.cell(idx, 4, gb_no)
    c_gb.font = font_data_bold
    c_gb.alignment = align_center
    c_gb.border = border_cell
    
    c_gbt = ws_log.cell(idx, 5, gb_tarih or "-")
    c_gbt.font = font_data
    if isinstance(gb_tarih, datetime.date):
        c_gbt.number_format = "DD.MM.YYYY"
    c_gbt.alignment = align_center
    c_gbt.border = border_cell
    
    c_ht = ws_log.cell(idx, 6, havale_tarih)
    c_ht.font = font_data
    c_ht.alignment = align_center
    c_ht.border = border_cell
    
    c_tut = ws_log.cell(idx, 7, tutar if tutar > 0 else "-")
    c_tut.font = font_data_bold
    if tutar > 0:
        c_tut.number_format = "#,##0.00"
    c_tut.alignment = align_right if tutar > 0 else align_center
    c_tut.border = border_cell
    
    c_dov = ws_log.cell(idx, 8, doviz)
    c_dov.font = font_data_bold
    c_dov.alignment = align_center
    c_dov.border = border_cell
    
    c_par = ws_log.cell(idx, 9, parca_durum)
    c_par.font = font_data
    c_par.alignment = align_center
    c_par.border = border_cell
    
    c_dur = ws_log.cell(idx, 10, durum)
    c_dur.alignment = align_center
    c_dur.border = border_cell
    if "YAPILDI" in durum or "KAPANDI" in durum:
        c_dur.font = font_yapildi
        c_dur.fill = fill_yapildi
    elif "İŞLEME" in durum or "ONAY" in durum:
        c_dur.font = Font(name="Segoe UI", size=9.5, bold=True, color="1F497D")
        c_dur.fill = PatternFill(start_color="DCE6F1", end_color="DCE6F1", fill_type="solid")
    else:
        c_dur.font = font_yapilacak
        c_dur.fill = fill_yapilacak
        
    c_not = ws_log.cell(idx, 11, notu)
    c_not.font = font_data
    c_not.alignment = align_left
    c_not.border = border_cell
    ws_log.row_dimensions[idx].height = 22

log_col_widths = {
    "A": 8,
    "B": 24,
    "C": 26,
    "D": 26,
    "E": 18,
    "F": 22,
    "G": 22,
    "H": 10,
    "I": 32,
    "J": 26,
    "K": 80
}
for col_letter, width in log_col_widths.items():
    ws_log.column_dimensions[col_letter].width = width


# -------------------------------------------------------------
# 3. GELEN PARALAR SHEET (USER'S ORIGINAL 52 ROWS ENHANCED)
# -------------------------------------------------------------
ws_gp = wb.create_sheet(title="GELEN PARALAR")
ws_gp.views.sheetView[0].showGridLines = True

gp_headers = [
    "KİMDEN / GÖNDEREN",
    "GELEN TUTAR",
    "DÖVİZ",
    "GELİŞ TARİHİ",
    "BEYANNAME / ETGB NO",
    "FATURA NO",
    "BANKA / ŞUBE",
    "İBKB DURUMU",
    "İBKB YAPILAN TUTAR",
    "İBKB YAPILACAK (KALAN)",
    "İBKB / TALİMAT TARİHİ",
    "AÇIKLAMA / İŞLEM NOTU"
]

ws_gp["A1"] = "GENEL TOPLAM (FİLTRELİ):"
ws_gp["A1"].font = font_section
ws_gp["A1"].alignment = align_right
ws_gp["A1"].fill = fill_subtotal
ws_gp["A1"].border = border_cell

ws_gp["B1"] = "=SUBTOTAL(9, B3:B54)"
ws_gp["B1"].font = font_data_bold
ws_gp["B1"].number_format = "#,##0.00"
ws_gp["B1"].alignment = align_right
ws_gp["B1"].fill = fill_subtotal
ws_gp["B1"].border = border_cell

for c_letter in ["C", "D", "E", "F", "G", "H"]:
    cell = ws_gp[f"{c_letter}1"]
    cell.fill = fill_subtotal
    cell.border = border_cell

ws_gp["I1"] = "=SUBTOTAL(9, I3:I54)"
ws_gp["I1"].font = font_yapildi
ws_gp["I1"].number_format = "#,##0.00"
ws_gp["I1"].alignment = align_right
ws_gp["I1"].fill = fill_subtotal
ws_gp["I1"].border = border_cell

ws_gp["J1"] = "=SUBTOTAL(9, J3:J54)"
ws_gp["J1"].font = font_yapilacak
ws_gp["J1"].number_format = "#,##0.00"
ws_gp["J1"].alignment = align_right
ws_gp["J1"].fill = fill_subtotal
ws_gp["J1"].border = border_cell

ws_gp["K1"].fill = fill_subtotal
ws_gp["K1"].border = border_cell
ws_gp["L1"].fill = fill_subtotal
ws_gp["L1"].border = border_cell
ws_gp.row_dimensions[1].height = 24

for col_idx, h in enumerate(gp_headers, start=1):
    cell = ws_gp.cell(2, col_idx, h)
    cell.font = font_header
    cell.fill = fill_navy_header
    cell.alignment = align_header
    cell.border = border_header
ws_gp.row_dimensions[2].height = 28

raw_gp_data = [
    ("Ben Ellis", 8525.0, "GBP", datetime.date(2026, 9, 1), "26341453EX017052 & H26-03604", "BS02026-13 / BR02026-25", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "01.10.2026 FedEx ETGB (5.638,10 GBP) ve 05.10.2026 GB (kalan 2.886,90 GBP) için İBKB talimatı verilecek."),
    ("ASSANI HAMADA Z", 500.0, "EUR", datetime.date(2026, 8, 26), "26341453EX015433", "BS02026000000010", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "02.09.2026 tescilli 500 EUR ETGB için İBKB talimatı verilecek."),
    ("AXLE ARTHUR PAUL FALKINGHAM", 1162.36, "USD", datetime.date(2026, 8, 18), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Eşleşecek beyanname/fatura bekleniyor)."),
    ("UAB MARIOLA", 220.0, "EUR", datetime.date(2026, 8, 14), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Closer Management LLP", 650.0, "EUR", datetime.date(2026, 8, 11), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("LONG TERM HVAC", 338.0, "USD", datetime.date(2026, 8, 3), "26341453EX013808", "BS02026000000007", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "06.08.2026 tescilli 4.360,50 USD ETGB'ye ait 3. parça peşin ödeme."),
    ("Cape Universal Oy", 400.0, "EUR", datetime.date(2026, 7, 31), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("PRINCE ARORA", 280.0, "EUR", datetime.date(2026, 7, 24), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("LONG TERM HVAC", 1300.0, "USD", datetime.date(2026, 7, 21), "26341453EX013808", "BS02026000000007", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "06.08.2026 tescilli 4.360,50 USD ETGB'ye ait 2. parça peşin ödeme."),
    ("LONG TERM HVAC", 2722.50, "USD", datetime.date(2026, 6, 25), "26341453EX013808", "BS02026000000007", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "06.08.2026 tescilli 4.360,50 USD ETGB'ye ait 1. parça peşin ödeme."),
    ("KOSHI EMILIANO", 180.0, "EUR", datetime.date(2026, 6, 19), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Armin Muhamedagic", 1166.0, "EUR", datetime.date(2026, 6, 11), "26341453EX011110", "BS02026000000005", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "26.06.2026 tescilli 2.131,92 EUR ETGB için 2. parça ödeme."),
    ("REFINE IDEAS", 500.0, "EUR", datetime.date(2026, 6, 10), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Dominik Robert Kozlowski", 250.0, "EUR", datetime.date(2026, 6, 9), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("MARQUE APS", 1260.0, "EUR", datetime.date(2026, 5, 20), "26341453EX010071", "BS02026000000004", "GARANTİ BBVA", "YAPILDI", 1260.0, datetime.date(2026, 9, 8), "08.09.2026 tarihli İBKB talimatı ile tamamı İBKB yapıldı."),
    ("MISHAYEV HEN HANANEL", 200.0, "EUR", datetime.date(2026, 5, 20), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("CAPE UNIVERSAL OY/VANS STORE FORUM", 450.0, "EUR", datetime.date(2026, 5, 12), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("CuterEsque Inc.", 985.70, "USD", datetime.date(2026, 5, 11), None, "BS02026000000003", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Fatura BS02026-3)."),
    ("SMEETS GERT", 3060.0, "EUR", datetime.date(2026, 5, 4), "26341453EX012346", "BS02026000000006", "GARANTİ BBVA", "YAPILDI", 3060.0, datetime.date(2026, 10, 2), "02.10.2026 İBKB talimatı bankaca tamamlandı ve hesaba geçti (Dekont: 2026-05-04-14.41.55)."),
    ("CuterEsque Inc.", 2857.0, "USD", datetime.date(2026, 5, 1), None, "BS02026000000003", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Fatura BS02026-3)."),
    ("Kreya Clothing", 350.0, "EUR", datetime.date(2026, 4, 23), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("WOODEN BAY CO", 595.0, "USD", datetime.date(2026, 4, 16), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Armin Muhamedagic", 976.0, "EUR", datetime.date(2026, 4, 14), "26341453EX011110", "BS02026000000005", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "26.06.2026 tescilli 2.131,92 EUR ETGB için 1. parça peşin ödeme."),
    ("TRINE OSTERUD", 961.0, "EUR", datetime.date(2026, 4, 14), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("MIRIAM HAITHAM A KHAYYAT", 482.61, "EUR", datetime.date(2026, 4, 13), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Yacine Abdoul Kader Adamou Alarba", 180.0, "EUR", datetime.date(2026, 4, 13), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("MARQUE APS", 2135.0, "EUR", datetime.date(2026, 4, 7), "26341453EX010071", "BS02026000000004", "GARANTİ BBVA", "YAPILDI", 1830.0, datetime.date(2026, 9, 8), "08.09.2026 talimatı ile 1.830 EUR İBKB yapıldı, 305 EUR serbest bakiye kaldı."),
    ("Pierre Marco", 160.0, "EUR", datetime.date(2026, 3, 16), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("YASIN PUSAT", 180.0, "EUR", datetime.date(2026, 2, 23), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("MME INES TAALIBI", 400.0, "EUR", datetime.date(2026, 1, 16), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("PAVLINKA SLAVCHEVA ZAHARINOVA", 230.0, "EUR", datetime.date(2026, 1, 14), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Joseph . Co Clothing Ltd", 335.0, "EUR", datetime.date(2026, 1, 12), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Hugh Edward Gold", 488.99, "EUR", datetime.date(2026, 1, 8), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("Hugh Edward Gold", 0.69, "EUR", datetime.date(2026, 1, 6), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("AURO APPAREL LTD", 550.0, "EUR", datetime.date(2026, 1, 5), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("SMEETS GERT", 100.0, "EUR", datetime.date(2025, 12, 29), "26341453EX012346", "BS02026000000006", "GARANTİ BBVA", "YAPILDI", 100.0, datetime.date(2026, 10, 2), "02.10.2026 İBKB talimatı bankaca tamamlandı ve hesaba geçti (Dekont: 2025-12-29-14.51.35)."),
    ("OLIVER JONATHAN FULoP", 250.0, "EUR", datetime.date(2025, 12, 22), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("RANA JASSIM KHALED ALSAADOUN", 1400.0, "EUR", datetime.date(2025, 12, 3), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("GbR Celik, David und Djemailji, L", 3239.18, "EUR", datetime.date(2025, 11, 26), None, "BS02025000000006", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Maneiro Fatura BS02025-6)."),
    ("ATTERO CLOTHING", 848.50, "EUR", datetime.date(2025, 11, 24), None, "BS02025000000005", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Attero Fatura BS02025-5)."),
    ("CHRISTIAN DORER", 340.0, "EUR", datetime.date(2025, 11, 24), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("ISLAME TAHRI", 350.0, "EUR", datetime.date(2025, 10, 30), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("GBR CELİK , DAVİD UND DJEMAİLJİ , LEO", 2757.0, "EUR", datetime.date(2025, 10, 28), None, "BS02025000000006", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Maneiro Fatura BS02025-6)."),
    ("ATTERO CLOTHING", 1932.0, "EUR", datetime.date(2025, 10, 22), None, "BS02025000000005", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Attero Fatura BS02025-5)."),
    ("GBR CELİK , DAVİD UND DJEMAİLJİ , LEO", 285.0, "EUR", datetime.date(2025, 10, 17), None, "BS02025000000006", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Maneiro Fatura BS02025-6)."),
    ("LAVI LA LLC", 20000.0, "USD", datetime.date(2025, 10, 14), "25341453EX026501", "BS02025-3 / BS02025-4", "GARANTİ BBVA", "YAPILDI", 20000.0, datetime.date(2025, 12, 8), "28.11.2025 (9.884,48 $) ve 08.12.2025 (10.115,52 $) talimatlarıyla tamamı İBKB yapıldı."),
    ("CuterEsque Inc.", 7000.0, "USD", datetime.date(2025, 10, 14), None, "BS02026000000003", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (CuterEsque Fatura)."),
    ("JAVIER OCANO CAMACHO", 310.0, "EUR", datetime.date(2025, 10, 13), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("INOI GLOBAL MOBILE PHONES LLC", 200.0, "EUR", datetime.date(2025, 10, 13), None, None, "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak."),
    ("GBR CELİK , DAVİD UND DJEMAİLJİ , LEO", 305.0, "EUR", datetime.date(2025, 10, 6), None, "BS02025000000006", "GARANTİ BBVA", "YAPILACAK", 0.0, None, "İBKB yapılacak (Maneiro Fatura BS02025-6)."),
    ("LAURA GOTTFRIED", 3819.0, "EUR", datetime.date(2025, 9, 22), "25343200EX010314", "ETGB 175984471", "GARANTİ BBVA", "YAPILDI", 3819.0, datetime.date(2025, 11, 3), "03.11.2025 tarihli 9.205 EUR talimatı ile İBKB yapıldı."),
    ("LAURA GOTTFRIED", 5386.0, "EUR", datetime.date(2025, 8, 28), "25343200EX010314", "ETGB 175984471", "GARANTİ BBVA", "YAPILDI", 5386.0, datetime.date(2025, 11, 3), "03.11.2025 tarihli 9.205 EUR talimatı ile İBKB yapıldı.")
]

for idx, item in enumerate(raw_gp_data, start=3):
    kimden, gelen_tutar, doviz, tarih, beyanname, fatura, banka, durum, ibkb_tutar, ibkb_tarih, aciklama = item
    
    c_kimden = ws_gp.cell(idx, 1, kimden)
    c_kimden.font = font_data_bold
    c_kimden.alignment = align_left
    c_kimden.border = border_cell
    
    c_tutar = ws_gp.cell(idx, 2, gelen_tutar)
    c_tutar.font = font_data_bold
    c_tutar.number_format = "#,##0.00"
    c_tutar.alignment = align_right
    c_tutar.border = border_cell
    
    c_doviz = ws_gp.cell(idx, 3, doviz)
    c_doviz.font = font_data_bold
    c_doviz.alignment = align_center
    c_doviz.border = border_cell
    
    c_tarih = ws_gp.cell(idx, 4, tarih)
    c_tarih.font = font_data
    c_tarih.number_format = "DD.MM.YYYY"
    c_tarih.alignment = align_center
    c_tarih.border = border_cell
    
    c_beyan = ws_gp.cell(idx, 5, beyanname or "-")
    c_beyan.font = font_data_bold if beyanname else font_data
    c_beyan.alignment = align_center if beyanname else align_center
    c_beyan.border = border_cell
    
    c_fat = ws_gp.cell(idx, 6, fatura or "-")
    c_fat.font = font_data
    c_fat.alignment = align_center
    c_fat.border = border_cell
    
    c_banka = ws_gp.cell(idx, 7, banka or "GARANTİ BBVA")
    c_banka.font = font_data
    c_banka.alignment = align_center
    c_banka.border = border_cell
    
    c_durum = ws_gp.cell(idx, 8, durum)
    c_durum.border = border_cell
    c_durum.alignment = align_center
    if durum == "YAPILDI":
        c_durum.font = font_yapildi
        c_durum.fill = fill_yapildi
    else:
        c_durum.font = font_yapilacak
        c_durum.fill = fill_yapilacak
        
    c_ibkb_tutar = ws_gp.cell(idx, 9, ibkb_tutar)
    c_ibkb_tutar.font = font_yapildi if ibkb_tutar > 0 else font_data
    c_ibkb_tutar.number_format = "#,##0.00"
    c_ibkb_tutar.alignment = align_right
    c_ibkb_tutar.border = border_cell
    
    c_kalan = ws_gp.cell(idx, 10, f"=B{idx}-I{idx}")
    c_kalan.font = font_yapilacak if durum == "YAPILACAK" or (gelen_tutar - ibkb_tutar) > 0 else font_data
    c_kalan.number_format = "#,##0.00"
    c_kalan.alignment = align_right
    c_kalan.border = border_cell
    
    c_ibkb_tarih = ws_gp.cell(idx, 11, ibkb_tarih or "-")
    c_ibkb_tarih.font = font_data
    if isinstance(ibkb_tarih, datetime.date):
        c_ibkb_tarih.number_format = "DD.MM.YYYY"
    c_ibkb_tarih.alignment = align_center
    c_ibkb_tarih.border = border_cell
    
    c_aciklama = ws_gp.cell(idx, 12, aciklama or "")
    c_aciklama.font = font_data
    c_aciklama.alignment = align_left
    c_aciklama.border = border_cell
    
    ws_gp.row_dimensions[idx].height = 20

gp_col_widths = {
    "A": 36,
    "B": 15,
    "C": 8,
    "D": 14,
    "E": 28,
    "F": 24,
    "G": 16,
    "H": 16,
    "I": 18,
    "J": 20,
    "K": 16,
    "L": 75
}
for col_letter, width in gp_col_widths.items():
    ws_gp.column_dimensions[col_letter].width = width


# -------------------------------------------------------------
# 4. BEYANNAME VE ETGB LER SHEET
# -------------------------------------------------------------
ws_bg = wb.create_sheet(title="BEYANNAME VE ETGB LER")
ws_bg.views.sheetView[0].showGridLines = True

bg_headers = [
    "MÜŞTERİ / FİRMA",
    "BEYANNAME TARİHİ",
    "BEYANNAME / ETGB NO",
    "FATURA NO",
    "BEYANNAME TUTARI",
    "DÖVİZ",
    "İBKB YAPILAN (KÜMÜLATİF)",
    "İBKB YAPILACAK (AÇIK KALAN)",
    "BEYANNAME TÜRÜ",
    "180 GÜN YASAL SÜRE SONU",
    "DURUM",
    "PARÇALI BOZUM VE GELEN HAVALE DETAYLARI"
]

for col_idx, h in enumerate(bg_headers, start=1):
    cell = ws_bg.cell(1, col_idx, h)
    cell.font = font_header
    cell.fill = fill_navy_header
    cell.alignment = align_header
    cell.border = border_header
ws_bg.row_dimensions[1].height = 28

declarations_data = [
    ("Gottfried Marketing Handel ve Veranstaltung", datetime.date(2025, 9, 22), "25343200EX010314", "ETGB 175984471", 9241.64, "EUR", 9205.00, "ETGB", "28.08.2025 (5.386 €) ve 22.09.2025 (3.819 €) İBKB yapıldı. Kalan 36,64 € terkin kapsamında."),
    ("LAVI LA LLC", datetime.date(2025, 11, 13), "25341453EX026501", "BS02025-3 / BS02025-4", 20000.00, "USD", 20000.00, "ETGB", "14.10.2025 peşin 20.000 $ bedelden 28.11.2025 (9.884,48 $) ve 08.12.2025 (10.115,52 $) İBKB yapıldı, tamamı kapandı."),
    ("MARQUE APS", datetime.date(2026, 5, 22), "26341453EX010071", "BS02026000000004", 3392.40, "EUR", 3090.00, "ETGB", "07.04.2026 (2.135 €'dan 1.830 €) ve 20.05.2026 (1.260 €) paralarından 08.09.2026 İBKB yapıldı. Tam kapandı."),
    ("SMEETS GERT", datetime.date(2026, 7, 8), "26341453EX012346", "BS02026000000006", 3345.60, "EUR", 3160.00, "ETGB", "29.12.2025 (100 €) ve 04.05.2026 (3.060 €) paralarından 3.160 EUR İBKB yapıldı ve hesaba geçti. Kalan açık: 185,60 € (180 gün yasal süresi: 04.01.2027)."),
    ("BEN ELLİS (1. YÜKLEME)", datetime.date(2026, 10, 1), "26341453EX017052", "BS02026000000013", 5638.10, "GBP", 0.0, "ETGB (FEDEX)", "01.09.2026 tarihli 8.525 GBP peşin bedelden 5.638,10 GBP bu ETGB için İBKB yapılacak (Tam Kapatacak)."),
    ("BEN ELLİS (2. YÜKLEME)", datetime.date(2026, 10, 5), "26341453EX00267850", "BR02026000000025", 15026.12, "GBP", 0.0, "GÜMRÜK BEYANNAMESİ", "01.09.2026 gelen paradan kalan 2.886,90 GBP peşin bedel mahsup edilecek. Kalan 12.139,22 GBP vadeli tahsil edilecek."),
    ("LONG TERM HVAC (EMK SYSTEM)", datetime.date(2026, 8, 6), "26341453EX013808", "BS02026000000007", 4360.50, "USD", 0.0, "ETGB", "Gelen paralar: 25.06.2026 (2.722,50 $), 21.07.2026 (1.300 $), 03.08.2026 (338 $). İBKB talimatı verilecek!"),
    ("Armin Muhamedagic", datetime.date(2026, 6, 26), "26341453EX011110", "BS02026000000005", 2131.92, "EUR", 0.0, "ETGB", "Gelen paralar: 14.04.2026 (976 €) ve 11.06.2026 (1.166 €) hazır. İBKB talimatı verilecek!"),
    ("EZC (ASSANI HAMADA)", datetime.date(2026, 9, 2), "26341453EX015433", "BS02026000000010", 500.00, "EUR", 0.0, "ETGB", "26.08.2026 gelen 500 € havale hazır. İBKB talimatı verilecek!"),
    ("ATTERO CLOTHING", datetime.date(2025, 11, 27), "FATURA BS02025-5", "BS02025000000005", 2780.37, "EUR", 0.0, "İHRACAT FATURASI", "22.10.2025 (1.932 €) + 24.11.2025 (848,50 €) paraları geldi."),
    ("MANEIRO (GBR ÇELİK)", datetime.date(2025, 11, 28), "FATURA BS02025-6", "BS02025000000006", 3470.04, "EUR", 0.0, "İHRACAT FATURASI", "Gelen paralar: 305 € + 285 € + 2.757 € + 3.239,18 €.")
]

for idx, decl in enumerate(declarations_data, start=2):
    müsteri, gb_tarih, gb_no, fatura_no, gb_tutar, doviz, ibkb_yapilan, gb_tur, aciklama = decl
    
    c_m = ws_bg.cell(idx, 1, müsteri)
    c_m.font = font_data_bold
    c_m.alignment = align_left
    c_m.border = border_cell
    
    c_t = ws_bg.cell(idx, 2, gb_tarih)
    c_t.font = font_data
    c_t.number_format = "DD.MM.YYYY"
    c_t.alignment = align_center
    c_t.border = border_cell
    
    c_no = ws_bg.cell(idx, 3, gb_no)
    c_no.font = font_data_bold
    c_no.alignment = align_center
    c_no.border = border_cell
    
    c_f = ws_bg.cell(idx, 4, fatura_no)
    c_f.font = font_data
    c_f.alignment = align_center
    c_f.border = border_cell
    
    c_tut = ws_bg.cell(idx, 5, gb_tutar)
    c_tut.font = font_data_bold
    c_tut.number_format = "#,##0.00"
    c_tut.alignment = align_right
    c_tut.border = border_cell
    
    c_dov = ws_bg.cell(idx, 6, doviz)
    c_dov.font = font_data_bold
    c_dov.alignment = align_center
    c_dov.border = border_cell
    
    c_yap = ws_bg.cell(idx, 7, ibkb_yapilan)
    c_yap.font = font_yapildi if ibkb_yapilan > 0 else font_data
    c_yap.number_format = "#,##0.00"
    c_yap.alignment = align_right
    c_yap.border = border_cell
    
    c_kal = ws_bg.cell(idx, 8, f"=E{idx}-G{idx}")
    c_kal.font = font_yapilacak
    c_kal.number_format = "#,##0.00"
    c_kal.alignment = align_right
    c_kal.border = border_cell
    
    c_tur = ws_bg.cell(idx, 9, gb_tur)
    c_tur.font = font_data
    c_tur.alignment = align_center
    c_tur.border = border_cell
    
    c_sure = ws_bg.cell(idx, 10, f"=B{idx}+180")
    c_sure.font = font_data
    c_sure.number_format = "DD.MM.YYYY"
    c_sure.alignment = align_center
    c_sure.border = border_cell
    
    c_dur = ws_bg.cell(idx, 11, f"=IF(H{idx}<=37, \"KAPANDI\", IF(G{idx}>0, \"KISMİ YAPILDI\", \"AÇIK\"))")
    c_dur.border = border_cell
    c_dur.alignment = align_center
    if ibkb_yapilan >= gb_tutar or (gb_tutar - ibkb_yapilan) <= 40:
        c_dur.font = font_kapandi
        c_dur.fill = fill_yapildi
    elif ibkb_yapilan > 0:
        c_dur.font = font_acik
        c_dur.fill = fill_yapilacak
    else:
        c_dur.font = font_acik
        c_dur.fill = fill_yapilacak
        
    c_acik = ws_bg.cell(idx, 12, aciklama)
    c_acik.font = font_data
    c_acik.alignment = align_left
    c_acik.border = border_cell
    ws_bg.row_dimensions[idx].height = 22

bg_col_widths = {
    "A": 36,
    "B": 18,
    "C": 26,
    "D": 22,
    "E": 18,
    "F": 8,
    "G": 18,
    "H": 22,
    "I": 20,
    "J": 18,
    "K": 16,
    "L": 75
}
for col_letter, width in bg_col_widths.items():
    ws_bg.column_dimensions[col_letter].width = width

if default_sheet in wb.worksheets:
    wb.remove(default_sheet)

wb.save(target_file)
wb.save(islenmis_file)
print("Workbook updated with Audit Log & enhanced styling.")
