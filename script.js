function trans(txtAre) {
    var remotePath = "https://easysinhalaunicode.com/Api/convert";
    $.ajax({
        url: remotePath,
        method: "POST",
        data: { data: $(txtAre).val() }
    })
    .done(function(msg) {
        $("#res").val(msg);
    })
    .fail(function(err) {
        $("#res").val("Error: " + err.statusText);
    });
}

function copyToClipboard() {
    var text = $("#res").val();
    navigator.clipboard.writeText(text).then(function() {
        $("#copyButton").text("Copied!");
        setTimeout(function() {
            $("#copyButton").text("Copy");
        }, 2000);
    }, function(err) {
        console.error('Could not copy text: ', err);
        $("#copyButton").text("Error");
        setTimeout(function() {
            $("#copyButton").text("Copy");
        }, 2000);
    });
}

$(document).ready(function() {
    $("#sou").on("input", function() {
        trans(this);
    });
    // Initial conversion
    trans($("#sou"));
});