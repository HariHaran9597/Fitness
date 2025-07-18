/**
 * ProgressDashboard.ts
 * Component for displaying user progress statistics
 */

import { UserProgress, WorkoutSession, Achievement, ExerciseStats } from '../../models/UserProgress';
import type { ExerciseType } from '../../types/index';

export class ProgressDashboard {
  private container: HTMLElement;
  private userProgress: UserProgress;
  private activeTab: 'overview' | 'history' | 'achievements' = 'overview';

  /**
   * Create a new ProgressDashboard
   * @param containerId ID of the container element
   * @param userProgress UserProgress instance
   */
  constructor(containerId: string, userProgress: UserProgress) {
    const container = document.getElementById(containerId);
    
    if (!container) {
      throw new Error(`Container element with ID "${containerId}" not found`);
    }
    
    this.container = container;
    this.userProgress = userProgress;
  }

  /**
   * Initialize the progress dashboard
   */
  public async initialize(): Promise<void> {
    // Add styles
    this.addStyles();
    
    // Render dashboard
    await this.render();
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Render the progress dashboard
   */
  private async render(): Promise<void> {
    // Clear container
    this.container.innerHTML = '';
    
    // Create dashboard structure
    const dashboard = document.createElement('div');
    dashboard.className = 'progress-dashboard';
    
    // Create tabs
    const tabs = document.createElement('div');
    tabs.className = 'progress-tabs';
    
    tabs.innerHTML = `
      <button class="tab-button ${this.activeTab === 'overview' ? 'active' : ''}" data-tab="overview">Overview</button>
      <button class="tab-button ${this.activeTab === 'history' ? 'active' : ''}" data-tab="history">History</button>
      <button class="tab-button ${this.activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements">Achievements</button>
    `;
    
    dashboard.appendChild(tabs);
    
    // Create tab content
    const tabContent = document.createElement('div');
    tabContent.className = 'tab-content';
    
    // Render active tab
    switch (this.activeTab) {
      case 'overview':
        await this.renderOverviewTab(tabContent);
        break;
      case 'history':
        await this.renderHistoryTab(tabContent);
        break;
      case 'achievements':
        this.renderAchievementsTab(tabContent);
        break;
    }
    
    dashboard.appendChild(tabContent);
    
    // Add reset button
    const resetButton = document.createElement('button');
    resetButton.className = 'reset-button';
    resetButton.textContent = 'Reset Progress';
    dashboard.appendChild(resetButton);
    
    // Add to container
    this.container.appendChild(dashboard);
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Tab buttons
    const tabButtons = this.container.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tab = button.getAttribute('data-tab') as 'overview' | 'history' | 'achievements';
        this.activeTab = tab;
        this.render();
      });
    });
    
    // Reset button
    const resetButton = this.container.querySelector('.reset-button');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        if (confirm('Are you sure you want to reset your progress? This cannot be undone.')) {
          await this.userProgress.resetUserProgress();
          this.render();
        }
      });
    }
  }

  /**
   * Render overview tab
   * @param container Tab content container
   */
  private async renderOverviewTab(container: HTMLElement): Promise<void> {
    const progressData = this.userProgress.getUserProgressData();
    
    if (!progressData) {
      container.innerHTML = '<p>No progress data available.</p>';
      return;
    }
    
    // Create overview content
    const overview = document.createElement('div');
    overview.className = 'overview-content';
    
    // Summary section
    const summary = document.createElement('div');
    summary.className = 'summary-section';
    
    const totalWorkouts = progressData.totalWorkouts;
    const totalTime = this.formatDuration(progressData.totalExerciseTime);
    const streakDays = progressData.streakDays;
    
    summary.innerHTML = `
      <div class="summary-card">
        <div class="summary-value">${totalWorkouts}</div>
        <div class="summary-label">Total Workouts</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${totalTime}</div>
        <div class="summary-label">Total Exercise Time</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">${streakDays}</div>
        <div class="summary-label">Day Streak</div>
      </div>
    `;
    
    overview.appendChild(summary);
    
    // Animals rescued section
    const animalsRescued = document.createElement('div');
    animalsRescued.className = 'animals-section';
    
    const totalAnimals = this.userProgress.getTotalAnimalsRescued();
    
    animalsRescued.innerHTML = `
      <h3>Animals Rescued</h3>
      <div class="animals-grid">
        <div class="animal-card">
          <div class="animal-icon">🐱</div>
          <div class="animal-count">${totalAnimals.cats}</div>
          <div class="animal-label">Cats</div>
        </div>
        <div class="animal-card">
          <div class="animal-icon">🐶</div>
          <div class="animal-count">${totalAnimals.dogs}</div>
          <div class="animal-label">Dogs</div>
        </div>
        <div class="animal-card">
          <div class="animal-icon">🐧</div>
          <div class="animal-count">${totalAnimals.penguins}</div>
          <div class="animal-label">Penguins</div>
        </div>
      </div>
    `;
    
    overview.appendChild(animalsRescued);
    
    // Exercise stats section
    const exerciseStats = document.createElement('div');
    exerciseStats.className = 'exercise-stats-section';
    exerciseStats.innerHTML = '<h3>Exercise Statistics</h3>';
    
    const statsGrid = document.createElement('div');
    statsGrid.className = 'stats-grid';
    
    // Get all exercise stats
    const allStats = this.userProgress.getAllExerciseStats();
    
    if (allStats.size === 0) {
      statsGrid.innerHTML = '<p>No exercise data available yet.</p>';
    } else {
      // Create stats for each exercise type
      allStats.forEach((stats, exerciseType) => {
        const exerciseCard = document.createElement('div');
        exerciseCard.className = 'exercise-stat-card';
        
        exerciseCard.innerHTML = `
          <h4>${this.formatExerciseType(exerciseType)}</h4>
          <div class="stat-row">
            <span class="stat-label">Total Reps:</span>
            <span class="stat-value">${stats.totalReps}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Total Time:</span>
            <span class="stat-value">${this.formatDuration(stats.totalDuration)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Average Form:</span>
            <span class="stat-value">${Math.round(stats.averageFormScore * 100)}%</span>
          </div>
          <div class="stat-row">
            <span class="stat-label">Animals Rescued:</span>
            <span class="stat-value">${stats.animalsRescued}</span>
          </div>
        `;
        
        statsGrid.appendChild(exerciseCard);
      });
    }
    
    exerciseStats.appendChild(statsGrid);
    overview.appendChild(exerciseStats);
    
    // Add to container
    container.appendChild(overview);
  }

  /**
   * Render history tab
   * @param container Tab content container
   */
  private async renderHistoryTab(container: HTMLElement): Promise<void> {
    // Create history content
    const history = document.createElement('div');
    history.className = 'history-content';
    
    // Get workout sessions
    try {
      const sessions = await this.userProgress.getWorkoutSessions(20);
      
      if (sessions.length === 0) {
        history.innerHTML = '<p>No workout history available yet.</p>';
      } else {
        // Create history table
        const table = document.createElement('table');
        table.className = 'history-table';
        
        table.innerHTML = `
          <thead>
            <tr>
              <th>Date</th>
              <th>Exercise</th>
              <th>Duration</th>
              <th>Reps</th>
              <th>Form Score</th>
              <th>Animals Rescued</th>
            </tr>
          </thead>
          <tbody>
            ${sessions.map(session => this.createSessionRow(session)).join('')}
          </tbody>
        `;
        
        history.appendChild(table);
      }
    } catch (error) {
      console.error('Failed to get workout sessions:', error);
      history.innerHTML = '<p>Failed to load workout history.</p>';
    }
    
    // Add to container
    container.appendChild(history);
  }

  /**
   * Create session row HTML
   * @param session Workout session
   */
  private createSessionRow(session: WorkoutSession): string {
    const date = this.formatDate(session.startTime);
    const exercise = this.formatExerciseType(session.exerciseType);
    const duration = this.formatDuration(session.duration);
    const formScore = Math.round(session.averageFormScore * 100);
    
    // Count total animals rescued
    let totalAnimals = 0;
    session.animalsRescued.forEach(animal => {
      totalAnimals += animal.count;
    });
    
    return `
      <tr>
        <td>${date}</td>
        <td>${exercise}</td>
        <td>${duration}</td>
        <td>${session.totalReps}</td>
        <td>${formScore}%</td>
        <td>${totalAnimals}</td>
      </tr>
    `;
  }

  /**
   * Render achievements tab
   * @param container Tab content container
   */
  private renderAchievementsTab(container: HTMLElement): void {
    // Create achievements content
    const achievements = document.createElement('div');
    achievements.className = 'achievements-content';
    
    // Get achievements
    const userAchievements = this.userProgress.getAchievements();
    
    if (userAchievements.length === 0) {
      achievements.innerHTML = '<p>No achievements unlocked yet. Keep exercising!</p>';
    } else {
      // Create achievements grid
      const grid = document.createElement('div');
      grid.className = 'achievements-grid';
      
      // Group achievements by category
      const categories = {
        exercise: { title: 'Exercise Achievements', achievements: [] as Achievement[] },
        rescue: { title: 'Rescue Achievements', achievements: [] as Achievement[] },
        streak: { title: 'Streak Achievements', achievements: [] as Achievement[] },
        form: { title: 'Form Achievements', achievements: [] as Achievement[] }
      };
      
      userAchievements.forEach(achievement => {
        categories[achievement.category].achievements.push(achievement);
      });
      
      // Create section for each category
      Object.values(categories).forEach(category => {
        if (category.achievements.length > 0) {
          const section = document.createElement('div');
          section.className = 'achievement-section';
          
          section.innerHTML = `<h3>${category.title}</h3>`;
          
          const achievementsGrid = document.createElement('div');
          achievementsGrid.className = 'category-achievements';
          
          category.achievements.forEach(achievement => {
            const achievementCard = document.createElement('div');
            achievementCard.className = 'achievement-card';
            
            achievementCard.innerHTML = `
              <div class="achievement-icon">${achievement.iconUrl}</div>
              <div class="achievement-info">
                <h4>${achievement.name}</h4>
                <p>${achievement.description}</p>
                <div class="achievement-date">Unlocked: ${this.formatDate(achievement.unlockedAt)}</div>
              </div>
            `;
            
            achievementsGrid.appendChild(achievementCard);
          });
          
          section.appendChild(achievementsGrid);
          grid.appendChild(section);
        }
      });
      
      achievements.appendChild(grid);
    }
    
    // Add to container
    container.appendChild(achievements);
  }

  /**
   * Format exercise type
   * @param exerciseType Exercise type
   */
  private formatExerciseType(exerciseType: ExerciseType): string {
    switch (exerciseType) {
      case 'pushup':
        return 'Push-ups';
      case 'chinup':
        return 'Chin-ups';
      case 'plank':
        return 'Planks';
      default:
        return exerciseType;
    }
  }

  /**
   * Format date
   * @param date Date
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  /**
   * Format duration
   * @param duration Duration in milliseconds
   */
  private formatDuration(duration: number): string {
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Add styles for progress dashboard
   */
  private addStyles(): void {
    // Create style element if it doesn't exist
    let styleElement = document.getElementById('progress-dashboard-styles');
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'progress-dashboard-styles';
      document.head.appendChild(styleElement);
    }
    
    // Add styles
    styleElement.textContent = `
      .progress-dashboard {
        font-family: Arial, sans-serif;
        color: var(--text-color, #333);
        padding: 20px;
        max-width: 1000px;
        margin: 0 auto;
      }
      
      .progress-tabs {
        display: flex;
        border-bottom: 2px solid var(--primary-color, #4ECDC4);
        margin-bottom: 20px;
      }
      
      .tab-button {
        padding: 10px 20px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        font-weight: bold;
        color: var(--text-color, #333);
        transition: all 0.3s ease;
      }
      
      .tab-button:hover {
        background-color: var(--background-color, rgba(78, 205, 196, 0.1));
      }
      
      .tab-button.active {
        color: var(--primary-color, #4ECDC4);
        border-bottom: 3px solid var(--primary-color, #4ECDC4);
      }
      
      .tab-content {
        min-height: 400px;
      }
      
      /* Overview Tab */
      .summary-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 30px;
      }
      
      .summary-card {
        background-color: var(--card-bg, #fff);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
        text-align: center;
        flex: 1;
        margin: 0 10px;
      }
      
      .summary-value {
        font-size: 36px;
        font-weight: bold;
        color: var(--primary-color, #4ECDC4);
        margin-bottom: 10px;
      }
      
      .summary-label {
        font-size: 14px;
        color: var(--text-color, #333);
      }
      
      .animals-section {
        margin-bottom: 30px;
      }
      
      .animals-section h3 {
        margin-bottom: 15px;
        color: var(--accent-color, #1A535C);
      }
      
      .animals-grid {
        display: flex;
        justify-content: space-between;
      }
      
      .animal-card {
        background-color: var(--card-bg, #fff);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
        text-align: center;
        flex: 1;
        margin: 0 10px;
      }
      
      .animal-icon {
        font-size: 40px;
        margin-bottom: 10px;
      }
      
      .animal-count {
        font-size: 24px;
        font-weight: bold;
        color: var(--primary-color, #4ECDC4);
        margin-bottom: 5px;
      }
      
      .animal-label {
        font-size: 14px;
        color: var(--text-color, #333);
      }
      
      .exercise-stats-section h3 {
        margin-bottom: 15px;
        color: var(--accent-color, #1A535C);
      }
      
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      
      .exercise-stat-card {
        background-color: var(--card-bg, #fff);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
      }
      
      .exercise-stat-card h4 {
        margin-top: 0;
        margin-bottom: 15px;
        color: var(--accent-color, #1A535C);
        border-bottom: 1px solid var(--background-color, rgba(78, 205, 196, 0.1));
        padding-bottom: 10px;
      }
      
      .stat-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .stat-label {
        color: var(--text-color, #333);
      }
      
      .stat-value {
        font-weight: bold;
        color: var(--primary-color, #4ECDC4);
      }
      
      /* History Tab */
      .history-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      
      .history-table th,
      .history-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      
      .history-table th {
        background-color: var(--background-color, rgba(78, 205, 196, 0.1));
        color: var(--accent-color, #1A535C);
        font-weight: bold;
      }
      
      .history-table tr:hover {
        background-color: var(--background-color, rgba(78, 205, 196, 0.1));
      }
      
      /* Achievements Tab */
      .achievements-grid {
        display: flex;
        flex-direction: column;
        gap: 30px;
      }
      
      .achievement-section h3 {
        margin-bottom: 15px;
        color: var(--accent-color, #1A535C);
      }
      
      .category-achievements {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
      }
      
      .achievement-card {
        background-color: var(--card-bg, #fff);
        border-radius: 10px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 20px;
        display: flex;
        align-items: center;
      }
      
      .achievement-icon {
        font-size: 40px;
        margin-right: 20px;
      }
      
      .achievement-info h4 {
        margin-top: 0;
        margin-bottom: 5px;
        color: var(--accent-color, #1A535C);
      }
      
      .achievement-info p {
        margin-top: 0;
        margin-bottom: 10px;
        color: var(--text-color, #333);
      }
      
      .achievement-date {
        font-size: 12px;
        color: #777;
      }
      
      .reset-button {
        margin-top: 30px;
        padding: 10px 20px;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        transition: all 0.3s ease;
      }
      
      .reset-button:hover {
        background-color: #d32f2f;
      }
      
      @media (max-width: 768px) {
        .summary-section,
        .animals-grid {
          flex-direction: column;
        }
        
        .summary-card,
        .animal-card {
          margin: 10px 0;
        }
        
        .stats-grid,
        .category-achievements {
          grid-template-columns: 1fr;
        }
      }
    `;
  }
}