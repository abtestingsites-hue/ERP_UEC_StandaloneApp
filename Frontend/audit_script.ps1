 = "D:\ERP\Frontend\src\features"
 = Get-ChildItem -Path  -Directory

 = @()

foreach ( in ) {
     = .Name
     = Join-Path .FullName "pages"
     = Join-Path .FullName "hooks"
     = Join-Path .FullName "api"
     = Join-Path .FullName "components"

     = Test-Path 
     = Test-Path 
     = Test-Path 
     = Test-Path 

     = 0
    if () {  = (Get-ChildItem -Path  -Filter *.tsx).Count }

     = 0
    if () {  = (Get-ChildItem -Path  -Filter *.ts*).Count }

     = 0
    if () {  = (Get-ChildItem -Path  -Filter *.ts*).Count }

     = 0
    if () {  = (Get-ChildItem -Path  -Filter *.tsx).Count }

    # Check for forms, tables, filters in pages/components
     = False
     = False
     = False

    if ( -or ) {
         = Get-ChildItem -Path .FullName -Recurse -Include *.tsx,*.ts
        foreach ( in ) {
             = Get-Content .FullName -Raw
            if ( -match "<form" -or  -match "useForm" -or  -match "Input" -or  -match "Select") {  = True }
            if ( -match "DataTable" -or  -match "<table" -or  -match "columns=") {  = True }
            if ( -match "FilterSection" -or  -match "search" -or  -match "filter") {  = True }
        }
    }

     = "?? MISSING"
    if ( -gt 0 -and  -gt 0) {
         = "?? PARTIAL"
        if ( -and  -and ) {
             = "?? COMPLETE"
        }
    }

     += [PSCustomObject]@{
        MODULE = 
        PAGES = 
        HOOKS = 
        API = 
        COMPONENTS = 
        FORM = if () { "Y" } else { "N" }
        TABLE = if () { "Y" } else { "N" }
        FILTER = if () { "Y" } else { "N" }
        STATUS = 
    }
}

 | Format-Table -AutoSize
