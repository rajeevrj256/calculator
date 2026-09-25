param(
    [Parameter(Mandatory = $true)][int]$SceneNum,
    [Parameter(Mandatory = $true)][string]$Text,
    [Parameter(Mandatory = $true)][string]$OutWav,
    [Parameter(Mandatory = $true)][string]$OutJson
)

Add-Type -AssemblyName System.Speech

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = 1

$wordList = [System.Collections.ArrayList]::Synchronized((New-Object System.Collections.ArrayList))
$sub = Register-ObjectEvent -InputObject $synth -EventName SpeakProgress -Action {
    $e = $Event.SourceEventArgs
    $null = $Event.MessageData.Add(@{ text = $e.Text; startMs = [int]$e.AudioPosition.TotalMilliseconds })
} -MessageData $wordList

$synth.SetOutputToWaveFile($OutWav)
$asyncHandle = $synth.SpeakAsync($Text)
while (-not $asyncHandle.IsCompleted) {
    Wait-Event -Timeout 1 | Out-Null
    Start-Sleep -Milliseconds 50
}
# Let the event queue fully drain after completion before tearing anything down.
for ($i = 0; $i -lt 10; $i++) {
    Wait-Event -Timeout 0.2 | Out-Null
    Start-Sleep -Milliseconds 100
}
$synth.SetOutputToDefaultAudioDevice()
$synth.Dispose()

$words = @($wordList | ForEach-Object { @{ text = $_.text; startMs = $_.startMs } })

@{ scene = $SceneNum; text = $Text; words = $words } | ConvertTo-Json -Depth 6 | Out-File -FilePath $OutJson -Encoding utf8

Write-Host "Scene $SceneNum : $($words.Count) words"
