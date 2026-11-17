# Captura Puyo → Nexus

Prototipo para Google Chrome, Puyo Champions y el aspecto visual de las cinco capturas proporcionadas.

## Instalar
1. Abre chrome://extensions en Chrome.
2. Activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida** y selecciona la carpeta **extension** de este proyecto.
4. Abre https://puyonexus.com/chainsim/ o recarga la pestaña si ya estaba abierta.

## Usar
1. Pausa el VOD en un estado estable.
2. Captura un único tablero completo: incluye su marco superior y lateral y las 12 filas visibles. Puede incluir el marcador inferior, como las muestras.
3. Haz clic en el área de pegado del panel **Captura Puyo → Nexus** y pulsa **Ctrl+V**. También puedes seleccionar un archivo.
4. Pulsa **Cargar en Nexus**. Se abre una pestaña nueva con el tablero editable.
5. Corrige allí cualquier error y agrega manualmente los Puyos ocultos que conozcas.

El título del panel permite plegarlo. La extensión solo se ejecuta en el simulador de Nexus; no pide acceso general a tus pestañas ni permiso para leer el portapapeles en segundo plano.

## Alcance y límites
- Reconoce rojo, verde, azul, amarillo, morado, basura y espacios vacíos.
- No incluye editor, piezas siguientes ni reconstrucción de filas ocultas.
- El detector está calibrado para el marco y las proporciones de Champions de estas muestras. Evita recortes sin marco, tableros deformados, capturas de pantalla completas y otros aspectos visuales.
- Ignora piezas separadas del suelo por una celda vacía. Una pieza activa que visualmente toque la pila puede ser indistinguible de una colocada.
- Un error de reconocimiento de vacío puede eliminar las piezas que haya encima en esa columna: revisa el resultado en Nexus.
- No hay una garantía de exactitud para otras capturas: estas cinco imágenes sirven tanto para calibración como para regresión, no como evaluación independiente.
- Las imágenes se procesan localmente. Al abrir el resultado, Nexus recibe los colores y posiciones codificados en la URL; no recibe la captura.
- No modifica el tablero anterior ni publica cadenas a través de la API de compartir.

## Integración verificada
El parámetro legacy **chain** de PuyoSim usa la tabla **0475681** para los tipos internos 0–6. El tablero se escribe por filas de arriba abajo; Nexus completa las celdas ocultas con vacíos.

Referencias del proyecto original:
- https://github.com/puyonexus/puyosim/blob/master/src/Service/LegacyChainParser.php
- https://github.com/puyonexus/puyosim/blob/master/src/Controller/HomeController.php

Las capturas en tests/fixtures son material de prueba aportado por el usuario y no forman parte de la carpeta que se instala como extensión.

## Marco superior cubierto
Si no se detecta la franja superior, la extensión intenta localizar dos bordes laterales oscuros y continuos, con contraste hacia el exterior, y el borde inferior. Estima la altura con las proporciones del tablero de Champions.

En este caso, el panel muestra **Marco superior estimado por los laterales**. Revisa en Nexus las piezas cubiertas por efectos: este método recupera la cuadrícula, no el color original de las piezas tapadas. Algunas skins también pueden necesitar ajustes de color.

Se requieren laterales y borde inferior suficientemente visibles. Si tampoco se detectan, se mantiene el error en lugar de aceptar una cuadrícula sin referencias.

La prueba **tests/overlay.test.html** comprueba la ubicación del marco en la captura real con animación y las 48 celdas inferiores de dos tableros conocidos con la zona superior tapada artificialmente. No afirma exactitud de colores en la captura con animación. Se incluye en **node tests/run-browser.cjs**.

### Skin con rojos rosados
La clasificación incluye rojos con tono cercano al magenta (desde 325°). La captura con animación ahora tiene comprobaciones de 70 celdas, incluidos los dos morados reales de la quinta columna. El amarillo y el verde superiores de la segunda columna siguen sin recuperarse de forma fiable bajo el efecto: se deben corregir manualmente en Nexus. Las pruebas no los cuentan como aciertos.

## Skin de bloques
Cuando no se puede localizar el marco, se busca como última alternativa una región de bloques rectangulares de colores con proporciones de tablero. Se exige evidencia de varias celdas y al menos tres colores; no basta con una imagen de color sólido.

La basura gris oscura se interpreta como basura únicamente en esta alternativa. La captura aportada se comprueba en tamaño original, al 75 % y al 50 %, también con recortes inferiores pequeños.

Limitación: esta detección necesita suficiente tablero ocupado para estimar sus límites. No implica compatibilidad general con tableros de bloques vacíos, poco llenos o recortados. Revisa el resultado en Nexus.
