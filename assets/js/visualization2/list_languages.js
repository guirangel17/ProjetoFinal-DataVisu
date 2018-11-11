d3.csv("data/repositories_per_month_languages.csv", function(error, data) {
	if (error) 
		throw error;

	// Retorna lista com nomes das linguagens
	var languages = [];
	for (var i = 0; i < data.length; i++) {
		lang = data[i]['language'];

		if (!languages.includes(lang)) {
			languages.push(lang);
		}
	}
	languages.sort();
	languages.unshift('Todas');


	// Adiciona lista de linguagens na página
	document.getElementById('opcoes').innerHTML = '';

	for (var i = 0; i < languages.length; i++) {

		var label = document.createElement("div");
		label.className = "texto-checkbox";
		var description = document.createTextNode((languages[i] == "\\N") ? "Sem Linguagem" : languages[i]);
		var checkbox = document.createElement("input");

		checkbox.type = "checkbox";   
		checkbox.name = languages[i].toLowerCase(); 
		checkbox.value = languages[i];       
		checkbox.className = "checkbox-bonito";
		checkbox.onclick = atualizaGrafico;

		label.appendChild(checkbox);  
		label.appendChild(description);

		document.getElementById('opcoes').appendChild(label);
	}
});