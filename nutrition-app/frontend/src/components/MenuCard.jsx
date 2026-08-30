const CATEGORY_LABELS = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  snack: 'Snack',
};

export default function MenuCard({ menu, onEat, onLikeFood, onDislikeFood, eatenFoodIds = [] }) {
  const categories = Object.keys(menu.items || {});

  return (
    <div>
      {categories.map((cat) => {
        const foods = menu.items[cat];
        if (!foods || foods.length === 0) return null;
        const catCalories = foods.reduce((s, f) => s + f.calories, 0);

        return (
          <div className="meal-section" key={cat}>
            <p className="meal-title">
              <span>{CATEGORY_LABELS[cat] || cat}</span>
              <span>{Math.round(catCalories)} kcal</span>
            </p>
            {foods.map((food) => {
              const eaten = eatenFoodIds.includes(food.id);
              return (
                <div className="food-item" key={food.id}>
                  <div className="food-info">
                    <div className="food-name">{food.name}</div>
                    <div className="food-meta">{Math.round(food.calories)} kcal</div>
                  </div>
                  <div className="food-actions">
                    {onLikeFood && (
                      <button
                        className={`btn btn-icon ${food.liked ? 'btn-liked' : ''}`}
                        onClick={() => onLikeFood(food.id)}
                        title="Me gusta"
                      >
                        {food.liked ? '❤️' : '🤍'}
                      </button>
                    )}
                    {onDislikeFood && (
                      <button className="btn btn-icon" onClick={() => onDislikeFood(food.id)} title="No me gusta">
                        🚫
                      </button>
                    )}
                    {onEat && (
                      <button
                        className="btn btn-icon"
                        onClick={() => onEat(food.id)}
                        title="Marcar como comido"
                        disabled={eaten}
                      >
                        {eaten ? '✅' : '➕'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
