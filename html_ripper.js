let tab = getTabId();

window.onload = function() {
	chrome.scripting.executeScript(
		target: {tabId: tab},
		func: injection,
	(result) => {});
	
function injection() {
	
}